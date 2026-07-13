'use strict';

// Akai APC mini -> MA dot2 web remote bridge.
// Button layout is unchanged from the original ArtGateOne script:
//
//   notes  0-15  fader buttons (HI: executor buttons / LO: fader exec buttons)
//   notes 16-63  8x6 executor grid
//   notes 64-71  momentary flash buttons for the 8 faders
//   notes 82-86  page select 1-5
//   note  87/88  wing 1 / wing 2
//   note  89     fader-button mode toggle (LED lit = LO)
//   note  98     SHIFT = blackout toggle
//   cc    48-55  executor faders, cc 56 = grand master

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const easymidi = require('easymidi');
const W3CWebSocket = require('websocket').w3cwebsocket;

// --------------------------------------------------------------------------
// config -- override any of these in config.json next to this file
// --------------------------------------------------------------------------
const DEFAULT_CONFIG = {
    host: 'ws://localhost:80/',   // dot2 web remote; use the console IP instead of localhost
    wing: 1,                      // 1 or 2
    page: 2,                      // 0 = page buttons off, 1 = exec buttons only, 2 = exec buttons + faders
    password: 'remote',           // web remote password
    midiIn: 'APC MINI',           // substring/regex matched against the available ports
    midiOut: 'APC MINI',
    pollIntervalMs: 100,          // how often playback state is requested back from dot2
    faderThrottleMs: 50,          // minimum gap between fader messages (0 and 127 always pass)
    reconnectDelayMs: 2000
};

function loadConfig() {
    const file = path.join(__dirname, 'config.json');
    if (!fs.existsSync(file)) return { ...DEFAULT_CONFIG };
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch (err) {
        console.log('config.json could not be read (' + err.message + '), using defaults');
        return { ...DEFAULT_CONFIG };
    }
}

const config = loadConfig();

// One-off override without editing config.json:  node dot2apcmini2m.js "<in port>" "<out port>"
if (process.argv[2]) config.midiIn = process.argv[2];
if (process.argv[3]) config.midiOut = process.argv[3];

// --------------------------------------------------------------------------
// constants
// --------------------------------------------------------------------------
const LED = {
    OFF: 0,
    GREEN: 1,
    GREEN_BLINK: 2,
    RED: 3,
    RED_BLINK: 4,
    YELLOW: 5,
    YELLOW_BLINK: 6
};

const NOTE_PAGE_FIRST = 82;   // 82..86 = page 1..5
const NOTE_WING_1 = 87;
const NOTE_WING_2 = 88;
const NOTE_FADER_MODE = 89;
const NOTE_SHIFT = 98;
const NOTE_COUNT = 90;        // notes we ever light up

const CC_FADER_FIRST = 48;
const CC_MASTER = 56;

// The ".2" logo drawn on the grid at startup.
const BOOT_PATTERN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 5, 5, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// MIDI fader value (0..127) -> dot2 fader value (0..1). Deliberately non-linear
// at the bottom so the first few millimetres of travel stay near zero.
const FADER_VALUE = [0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034, 0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077, 0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12, 0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1, 1];

// --------------------------------------------------------------------------
// executor maps -- wing 2 is wing 1 shifted by 8 executors
// --------------------------------------------------------------------------

// note 0..63 -> executor index
function makeButtonMap(wing) {
    const off = (wing - 1) * 8;
    const map = new Array(64);
    for (let n = 0; n <= 7; n++) map[n] = 213 - n + off;          // fader buttons, upper row
    for (let n = 8; n <= 15; n++) map[n] = 121 - n + off;         // fader buttons, lower row
    for (let n = 16; n <= 63; n++) {
        const row = Math.floor((n - 16) / 8);                     // 0..5 -> 800,700,...,300
        const col = n % 8;
        map[n] = (800 - row * 100) + (7 - col) + off;
    }
    return map;
}

// note 0..15 -> fader executor index (LO mode)
function makeFaderButtonMap(wing) {
    const off = (wing - 1) * 8;
    const map = new Array(16);
    for (let n = 0; n < 16; n++) map[n] = 13 - (n % 8) + off;
    return map;
}

// cc 48..55 -> fader executor index
function makeFaderExecMap(wing) {
    const off = (wing - 1) * 8;
    const map = [];
    for (let i = 0; i < 8; i++) map[CC_FADER_FIRST + i] = 13 - i + off;
    return map;
}

// --------------------------------------------------------------------------
// state
// --------------------------------------------------------------------------
let wing = config.wing === 2 ? 2 : 1;
let buttons = makeButtonMap(wing);
let fbuttons = makeFaderButtonMap(wing);
let faderExec = makeFaderExecMap(wing);

let blackout = false;
let pageIndex = 0;        // executor buttons
let pageIndex2 = 0;       // faders
let faderMode = 'HI';     // 'HI' or 'LO'

let session = 0;
let requestCount = 0;
let pollTimer = null;
let client = null;
let shuttingDown = false;

const ledmatrix = new Array(NOTE_COUNT).fill(LED.OFF);
const faderValueMem = new Array(CC_MASTER + 1).fill(0);
const faderTime = new Array(CC_MASTER + 1).fill(0n);

// Master starts at full: we cannot read the physical fader, and dot2's grand
// master defaults to 100%. Blackout-off restores this value.
faderValueMem[CC_MASTER] = 1;

// --------------------------------------------------------------------------
// midi
// --------------------------------------------------------------------------
function findPort(ports, wanted, kind) {
    const re = new RegExp(wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'), 'i');
    const hit = ports.find(p => re.test(p));
    if (!hit) {
        console.log('');
        console.log('ERROR: no MIDI ' + kind + ' port matching "' + wanted + '".');
        console.log('Available ' + kind + ' ports: ' + (ports.length ? ports.join(', ') : '(none)'));
        console.log('Plug in the APC mini, or set "midiIn"/"midiOut" in config.json.');
        process.exit(1);
    }
    return hit;
}

console.log('Akai APC mini .2  ->  dot2 web remote');
console.log('');
console.log('Midi IN : ' + easymidi.getInputs().join(', '));
console.log('Midi OUT: ' + easymidi.getOutputs().join(', '));
console.log('');

const inPortName = findPort(easymidi.getInputs(), config.midiIn, 'input');
const outPortName = findPort(easymidi.getOutputs(), config.midiOut, 'output');
console.log('Using "' + inPortName + '" / "' + outPortName + '"');

const input = new easymidi.Input(inPortName);
const output = new easymidi.Output(outPortName);

function led(note, velocity) {
    if (ledmatrix[note] === velocity) return;
    ledmatrix[note] = velocity;
    output.send('noteon', { note: note, velocity: velocity, channel: 0 });
}

// Same as led() but always writes, for the control buttons whose state we set
// rather than mirror from dot2.
function ledForce(note, velocity) {
    ledmatrix[note] = velocity;
    output.send('noteon', { note: note, velocity: velocity, channel: 0 });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// Bulk LED writes are sent in small bursts so the APC's MIDI buffer keeps up.
// Unlike the original this yields to the event loop instead of spinning the CPU.
async function paintAll(pattern) {
    for (let n = 0; n < NOTE_COUNT; n++) {
        ledmatrix[n] = pattern[n] || LED.OFF;
        output.send('noteon', { note: n, velocity: ledmatrix[n], channel: 0 });
        if (n % 10 === 9) await delay(5);
    }
}

function paintControlLeds() {
    if (config.page > 0) {
        for (let n = NOTE_PAGE_FIRST; n <= NOTE_PAGE_FIRST + 4; n++) {
            ledForce(n, n === NOTE_PAGE_FIRST + pageIndex ? LED.GREEN : LED.OFF);
        }
    }
    ledForce(NOTE_WING_1, wing === 1 ? LED.GREEN : LED.OFF);
    ledForce(NOTE_WING_2, wing === 2 ? LED.GREEN : LED.OFF);
    ledForce(NOTE_FADER_MODE, faderMode === 'LO' ? LED.GREEN : LED.OFF);
}

// --------------------------------------------------------------------------
// websocket send helpers
// --------------------------------------------------------------------------
function send(msg) {
    if (!client || client.readyState !== client.OPEN) return;
    try {
        client.send(JSON.stringify({ ...msg, session: session }));
    } catch (err) {
        console.log('send failed: ' + err.message);
    }
}

function sendCommand(command) {
    send({ command: command, requestType: 'command', maxRequests: 0 });
}

function sendButton(execIndex, page, buttonId, pressed) {
    send({
        requestType: 'playbacks_userInput',
        cmdline: '',
        execIndex: execIndex,
        pageIndex: page,
        buttonId: buttonId,
        pressed: pressed,
        released: !pressed,
        type: 0,
        maxRequests: 0
    });
}

function sendFader(execIndex, value) {
    send({
        requestType: 'playbacks_userInput',
        execIndex: execIndex,
        pageIndex: pageIndex2,
        faderValue: value,
        type: 1,
        maxRequests: 0
    });
}

function setMaster(value) {
    sendCommand('SpecialMaster 2.1 At ' + value * 100);
}

// Poll dot2 for the playback state that drives the LEDs.
function poll() {
    if (session <= 0) return;
    const gridStart = [300, 400, 500, 600, 700, 800].map(v => v + (wing - 1) * 8);
    const faderStart = [6, 106, 206].map(v => v + (wing - 1) * 8);

    send({
        requestType: 'playbacks',
        startIndex: gridStart,
        itemsCount: [8, 8, 8, 8, 8, 8],
        pageIndex: pageIndex,
        itemsType: [3, 3, 3, 3, 3, 3],
        view: 3,
        execButtonViewMode: 2,
        buttonsViewMode: 0,
        maxRequests: 1
    });
    send({
        requestType: 'playbacks',
        startIndex: faderStart,
        itemsCount: [8, 8, 8],
        pageIndex: pageIndex2,
        itemsType: [2, 3, 3],
        view: 2,
        execButtonViewMode: 1,
        buttonsViewMode: 0,
        maxRequests: 1
    });
}

// --------------------------------------------------------------------------
// midi input
// --------------------------------------------------------------------------
function selectWing(next) {
    wing = next;
    buttons = makeButtonMap(wing);
    fbuttons = makeFaderButtonMap(wing);
    faderExec = makeFaderExecMap(wing);
    paintControlLeds();
}

function handlePad(note, pressed) {
    if (note >= 0 && note <= 15) {
        if (faderMode === 'HI') {
            sendButton(buttons[note], pageIndex2, 0, pressed);
        } else {
            sendButton(fbuttons[note], pageIndex2, note < 8 ? 1 : 0, pressed);
        }
        return;
    }

    if (note >= 16 && note <= 63) {
        sendButton(buttons[note], pageIndex, 0, pressed);
        return;
    }

    // Flash buttons: hold = fader to full, release = back to the physical position.
    if (note >= 64 && note <= 71) {
        const cc = CC_FADER_FIRST + (note - 64);
        sendFader(faderExec[cc], pressed ? 1 : faderValueMem[cc]);
    }
}

input.on('noteon', function (msg) {
    try {
        handlePad(msg.note, true);

        if (config.page > 0 && msg.note >= NOTE_PAGE_FIRST && msg.note <= NOTE_PAGE_FIRST + 4) {
            pageIndex = msg.note - NOTE_PAGE_FIRST;
            if (config.page === 2) pageIndex2 = pageIndex;
            paintControlLeds();
        }

        if (msg.note === NOTE_WING_1) selectWing(1);
        if (msg.note === NOTE_WING_2) selectWing(2);

        if (msg.note === NOTE_FADER_MODE) {
            faderMode = faderMode === 'LO' ? 'HI' : 'LO';
            paintControlLeds();
        }

        if (msg.note === NOTE_SHIFT) {
            blackout = !blackout;
            setMaster(blackout ? 0 : faderValueMem[CC_MASTER]);
        }
    } catch (err) {
        console.log('noteon error: ' + err.message);
    }
});

input.on('noteoff', function (msg) {
    try {
        handlePad(msg.note, false);
    } catch (err) {
        console.log('noteoff error: ' + err.message);
    }
});

input.on('cc', function (msg) {
    try {
        const cc = msg.controller;
        if (cc < CC_FADER_FIRST || cc > CC_MASTER) return;

        // Throttle: the APC streams far more fader messages than dot2 needs.
        // The end points always get through so a fader never sticks short of 0/100%.
        const now = process.hrtime.bigint();
        const overdue = now - faderTime[cc] >= BigInt(config.faderThrottleMs) * 1000000n;
        if (!overdue && msg.value !== 0 && msg.value !== 127) return;
        faderTime[cc] = now;

        const value = FADER_VALUE[msg.value];
        faderValueMem[cc] = value;

        if (cc === CC_MASTER) {
            // While blacked out the master is held at 0; the new position is
            // remembered and applied when blackout is released.
            if (!blackout) setMaster(value);
        } else {
            sendFader(faderExec[cc], value);
        }
    } catch (err) {
        console.log('cc error: ' + err.message);
    }
});

// --------------------------------------------------------------------------
// led feedback from dot2
// --------------------------------------------------------------------------
function isRun(item) {
    return item && item[0] && item[0].isRun === 1;
}

function isBlack(item) {
    return item && item[0] && item[0].i && item[0].i.c === '#000000';
}

// Running executors blink while the console is blacked out.
function onColor() {
    return blackout ? LED.GREEN_BLINK : LED.GREEN;
}

function renderGrid(obj) {
    let note = 63;
    for (let g = 0; g < 6; g++) {
        for (let i = 0; i < 8; i++) {
            const item = obj.itemGroups[g].items[i];
            let m;
            if (isRun(item)) m = onColor();
            else if (isBlack(item)) m = LED.OFF;
            else m = LED.RED;
            led(note, m);
            note--;
        }
    }
}

function renderFaders(obj) {
    let note = 71;
    for (let i = 0; i < 8; i++) {   // flash-button row
        const item = obj.itemGroups[0].items[i];
        let m = isRun(item) ? onColor() : LED.OFF;
        led(note, m);

        if (faderMode === 'LO') {
            if (isRun(item)) m = onColor();
            else if (isBlack(item)) m = LED.OFF;
            else m = LED.YELLOW;

            led(note - 64, m);                                  // notes 7..0
            if (m === LED.GREEN || m === LED.GREEN_BLINK) m = LED.YELLOW;
            led(note - 56, m);                                  // notes 15..8
        }
        note--;
    }

    if (faderMode === 'HI') {
        note = 15;
        for (let g = 1; g <= 2; g++) {
            for (let i = 0; i < 8; i++) {
                const item = obj.itemGroups[g].items[i];
                let m;
                if (isRun(item)) m = onColor();
                else if (isBlack(item)) m = LED.OFF;
                else m = LED.RED;
                led(note, m);
                note--;
            }
        }
    }
}

// --------------------------------------------------------------------------
// websocket
// --------------------------------------------------------------------------
function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

function connect() {
    console.log('Connecting to dot2 at ' + config.host + ' ...');
    session = 0;
    requestCount = 0;
    client = new W3CWebSocket(config.host);

    client.onerror = function () {
        console.log('Connection error');   // onclose follows and schedules the retry
    };

    client.onopen = function () {
        console.log('WebSocket connected');
    };

    client.onclose = function () {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        session = 0;
        if (shuttingDown) return;
        console.log('Connection lost, retrying in ' + config.reconnectDelayMs + 'ms');
        paintAll(BOOT_PATTERN);
        setTimeout(connect, config.reconnectDelayMs);
    };

    client.onmessage = function (e) {
        if (typeof e.data !== 'string') return;

        let obj;
        try {
            obj = JSON.parse(e.data);
        } catch (err) {
            return;   // dot2 occasionally emits things we do not care about
        }

        try {
            handleMessage(obj);
        } catch (err) {
            console.log('message error: ' + err.message);
        }
    };
}

function handleMessage(obj) {
    // dot2 drops the session if it does not hear from us often enough.
    requestCount++;
    if (requestCount >= 9) {
        send({});
        send({ requestType: 'getdata', data: 'set', maxRequests: 1 });
        requestCount = 0;
    }

    if (obj.status === 'server ready') {
        console.log('Server ready');
        send({});
    }

    if (obj.forceLogin === true) {
        console.log('Logging in ...');
        session = obj.session;
        send({
            requestType: 'login',
            username: 'remote',
            password: md5(config.password),
            maxRequests: 10
        });
    }

    if (obj.session === 0) {
        console.log('Connection error, re-announcing session');
        send({});
    }

    if (obj.session) {
        if (obj.session === -1) {
            console.log('Please turn on Web Remote in dot2 and set the password to "' + config.password + '"');
            shutdown(1);
            return;
        }
        session = obj.session;
    }

    if (obj.text) console.log(obj.text);

    if (obj.responseType === 'login' && obj.result === true) {
        console.log('Logged in, session ' + session + ' -- wing ' + wing);
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(poll, config.pollIntervalMs);
    }

    if (obj.responseType === 'playbacks' && obj.itemGroups) {
        if (obj.responseSubType === 3) renderGrid(obj);
        if (obj.responseSubType === 2) renderFaders(obj);
    }
}

// --------------------------------------------------------------------------
// startup / shutdown
// --------------------------------------------------------------------------
let shutdownStarted = false;

async function shutdown(code) {
    if (shutdownStarted) return;
    shutdownStarted = true;
    shuttingDown = true;

    if (pollTimer) clearInterval(pollTimer);
    console.log('');
    console.log('Clearing APC and closing ...');

    try {
        await paintAll(new Array(NOTE_COUNT).fill(LED.OFF));
        for (const n of [NOTE_PAGE_FIRST, NOTE_PAGE_FIRST + 1, NOTE_PAGE_FIRST + 2, NOTE_PAGE_FIRST + 3, NOTE_PAGE_FIRST + 4, NOTE_WING_1, NOTE_WING_2, NOTE_FADER_MODE]) {
            ledForce(n, LED.OFF);
        }
    } catch (err) {
        // the device may already be gone; nothing useful to do here
    }

    try { if (client && client.readyState === client.OPEN) client.close(); } catch (err) { }
    try { input.close(); } catch (err) { }
    try { output.close(); } catch (err) { }

    process.exit(code || 0);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async function main() {
    await paintAll(BOOT_PATTERN);
    paintControlLeds();
    connect();
})();
