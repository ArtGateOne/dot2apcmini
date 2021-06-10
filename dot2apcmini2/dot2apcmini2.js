var easymidi = require('easymidi');
var W3CWebSocket = require('websocket')
    .w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:80/'); //U can change localhost(127.0.0.1) to Your console IP address


//config 
wing = 1;   //set wing 1 or 2
page = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)
midi_in = 'APC MINI 0';     //set correct midi in device name
midi_out = 'APC MINI 1';    //set correct midi out device name


//global variables
var blackout = 0; //0 off 1 on
var pageIndex = 0;
var pageIndex2 = 0;
var faderbuttons = "LO";
var request = 0;
var session = 0;
var exec = JSON.parse('{"index":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,4,3,2,1,0,66,66,66,66,66],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,12,11,10,9,8,7,6,66],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,20,19,18,17,16,15,14,66]]}');
var ledmatrix = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 5, 5, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var faderValue = [0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034, 0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077, 0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12, 0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1, 1];
var faderValueMem = [0, 0, 0];
var faderTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const NS_PER_SEC = 1e9;


if (wing == 1) {
    faderValueMem[56] = 1;
    var fbuttons = [13, 12, 11, 10, 9, 8, 7, 6, 13, 12, 11, 10, 9, 8, 7, 6];
    var buttons = [213, 212, 211, 210, 209, 208, 207, 206, 113, 112, 111, 110, 109, 108, 107, 106, 807, 806, 805, 804, 803, 802, 801, 800, 707, 706, 705, 704, 703, 702, 701, 700, 607, 606, 605, 604, 603, 602, 601, 600, 507, 506, 505, 504, 503, 502, 501, 500, 407, 406, 405, 404, 403, 402, 401, 400, 307, 306, 305, 304, 303, 302, 301, 300];
} else if (wing == 2) {
    var fbuttons = [21, 20, 19, 18, 17, 16, 15, 14, 21, 20, 19, 18, 17, 16, 15, 14];
    var buttons = [221, 220, 219, 218, 217, 216, 215, 214, 121, 120, 119, 118, 117, 116, 115, 114, 815, 814, 813, 812, 811, 810, 809, 808, 715, 714, 713, 712, 711, 710, 709, 708, 615, 614, 613, 612, 611, 610, 609, 608, 515, 514, 513, 512, 511, 510, 509, 508, 415, 414, 413, 412, 411, 410, 409, 408, 315, 314, 313, 312, 311, 310, 309, 308];
}



for (i = 48; i <= 56; i++) { //fader time set
    faderTime[i] = process.hrtime();
}

//sleep function
function sleep(time, callback) {
    var stop = new Date()
        .getTime();
    while (new Date()
        .getTime() < stop + time) {
        ;
    }
    callback();
}


//interval send data to server function
function interval() {
    if (session > 0) {
        if (wing == 1) {
            client.send('{"requestType":"playbacks","startIndex":[300,400,500,600,700,800],"itemsCount":[8,8,8,8,8,8],"pageIndex":' + pageIndex + ',"itemsType":[3,3,3,3,3,3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[6,106,206],"itemsCount":[8,8,8],"pageIndex":' + pageIndex2 + ',"itemsType":[2,3,3],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');

        }
        if (wing == 2) {
            client.send('{"requestType":"playbacks","startIndex":[308,408,508,608,708,808],"itemsCount":[8,8,8,8,8,8],"pageIndex":' + pageIndex + ',"itemsType":[3,3,3,3,3,3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[14,114,214],"itemsCount":[8,8,8],"pageIndex":' + pageIndex2 + ',"itemsType":[2,3,3],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
    }
}


//midi clear function
function midiclear() {
    for (i = 0; i < 90; i++) {
        ledmatrix[i] = 0;
        output.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    return;
}


//clear terminal
//console.log('\033[2J');

//display info
console.log("Akai APC mini .2 WING " + wing);
console.log(" ");

//display all midi devices
console.log("Midi IN");
console.log(easymidi.getInputs());
console.log("Midi OUT");
console.log(easymidi.getOutputs());

console.log(" ");

console.log("Connecting to midi device " + midi_in);

//open midi device
var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

//sleep 1000
sleep(1000, function () {
    // executes after one second, and blocks the thread
});


//clear led matrix and led status - display .2 
for (i = 0; i < 90; i++) {
    output.send('noteon', { note: i, velocity: ledmatrix[i], channel: 0 });
    sleep(10, function () { });
}


//turn on page select buttons
if (page > 0) {
    output.send('noteon', { note: 82, velocity: 1, channel: 0 });
    output.send('noteon', { note: 83, velocity: 0, channel: 0 });
    output.send('noteon', { note: 84, velocity: 0, channel: 0 });
    output.send('noteon', { note: 85, velocity: 0, channel: 0 });
    output.send('noteon', { note: 86, velocity: 0, channel: 0 });
}

//turn on led buttons
output.send('noteon', { note: 88, velocity: 0, channel: 0 });//fader buttons select HI
output.send('noteon', { note: 89, velocity: 1, channel: 0 });//fader buttons select LO




//input.on('noteon', msg => console.log('noteon', msg.note, msg.velocity, msg.channel));
input.on('noteon', function (msg) {

    if (msg.note >= 0 && msg.note <= 15) {
        if (faderbuttons == "HI") {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
        } else {
            if (msg.note < 8) {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":1,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
            }
        }
    }

    if (msg.note >= 16 && msg.note <= 63) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 64 && msg.note <= 71) {
        client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.note - 16] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + 1 + ',"type":1,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 82 && msg.note <= 86) {
        if (page == 1) {
            output.send('noteon', { note: (pageIndex + 82), velocity: 0, channel: 0 });
            pageIndex = msg.note - 82;
            output.send('noteon', { note: (msg.note), velocity: 1, channel: 0 });
        }
        if (page == 2) {
            output.send('noteon', { note: (pageIndex + 82), velocity: 0, channel: 0 });
            pageIndex = msg.note - 82;
            pageIndex2 = msg.note - 82;
            output.send('noteon', { note: (msg.note), velocity: 1, channel: 0 });
        }

    }

    if (msg.note == 88) {//fader buttons HI
        faderbuttons = "HI";
        output.send('noteon', { note: 88, velocity: 1, channel: 0 });
        output.send('noteon', { note: 89, velocity: 0, channel: 0 });
    }
    if (msg.note == 89) {//fader buttons LO
        faderbuttons = "LO";
        output.send('noteon', { note: 88, velocity: 0, channel: 0 });
        output.send('noteon', { note: 89, velocity: 1, channel: 0 });
    }

    if (msg.note == 98) {//Shift Button
        if (wing == 1) {
            if (blackout == 0) {
                client.send('{"command":"SpecialMaster 2.1 At 0","session":' + session + ',"requestType":"command","maxRequests":0}');
                blackout = 1;
            } else if (blackout == 1) {
                client.send('{"command":"SpecialMaster 2.1 At ' + faderValueMem[56] * 100 + '","session":' + session + ',"requestType":"command","maxRequests":0}');
                blackout = 0;
            }

        } else {
            client.send('{"command":"Learn SpecialMaster 3.1","session":' + session + ',"requestType":"command","maxRequests":0}');
        }
    }


});


input.on('noteoff', function (msg) {

    if (msg.note >= 0 && msg.note <= 15) {
        if (faderbuttons == "HI") {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
        } else {
            if (msg.note < 8) {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":1,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
            }
        }
    }

    if (msg.note >= 16 && msg.note <= 63) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    if (msg.note >= 64 && msg.note <= 71) {
        client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.note - 16] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValueMem[msg.note - 16] + ',"type":1,"session":' + session + ',"maxRequests":0}');
    }

});

input.on('cc', function (msg) {
    diff = process.hrtime(faderTime[msg.controller]);
    if ((diff[0] * NS_PER_SEC + diff[1]) >= 50000000 | msg.value == 0 | msg.value == 127) {

        faderTime[msg.controller] = process.hrtime();

        faderValueMem[msg.controller] = faderValue[msg.value];


        if (wing == 1) {
            if (msg.controller == 56) {
                if (blackout == 0){
                client.send('{"command":"SpecialMaster 2.1 At ' + (faderValue[msg.value] * 100) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
                }
            } else {
                client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
            }

        }

        if (wing == 2) {
            if (msg.controller == 56) {
                client.send('{"command":"SpecialMaster 3.1 At ' + (faderValue[msg.value] * 225) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
            }
        }
    }
});




console.log("Connecting to dot2 ...");
//WEBSOCKET-------------------
client.onerror = function () {
    console.log('Connection Error');
};

client.onopen = function () {
    console.log('WebSocket Client Connected');

    function sendNumber() {
        if (client.readyState === client.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            client.send(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    //sendNumber();
};

client.onclose = function () {
    console.log('Client Closed');
    for (i = 0; i < 90; i++) {
        output.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    input.close();
    output.close();
    process.exit();
};

client.onmessage = function (e) {


    request = request + 1;
    //console.log(request);
    if (request >= 9) {
        client.send('{"session":' + session + '}');
        client.send('{"requestType":"getdata","data":"set","session":' + session + ',"maxRequests":1}');
        request = 0;
    }





    if (typeof e.data === 'string') {
        //console.log("Received: '" + e.data + "'");
        //console.log(e.data);


        obj = JSON.parse(e.data);
        //console.log(obj);


        if (obj.status == "server ready") {
            console.log("SERVER READY");
            client.send('{"session":0}')
        }
        if (obj.forceLogin == true) {
            console.log("LOGIN ...");
            session = (obj.session);
            client.send('{"requestType":"login","username":"remote","password":"2c18e486683a3db1e645ad8523223b72","session":' + obj.session + ',"maxRequests":10}')
        }

        if (obj.session == 0) {
            console.log("CONNECTION ERROR");
            client.send('{"session":' + session + '}');
        }

        if (obj.session) {
            if (obj.session == -1) {
                console.log("Please turn on Web Remote, and set Web Remote password to \"remote\"");
                midiclear();
                input.close();
                output.close();
                process.exit();
            } else {
                session = (obj.session);
            }
        }

        if (obj.text) {
            console.log(obj.text);
            text = obj.text;
        }


        if (obj.responseType == "login" && obj.result == true) {
            setInterval(interval, 100);//80
            console.log("...LOGGED");
            console.log("SESSION " + session);
        }

        if (obj.responseType == "presetTypeList") {
            //console.log("Preset Type List");
        }


        if (obj.responseType == "presetTypes") {
            //console.log("Preset Types");
        }

        if (obj.responseType == "getdata") {
            //console.log("Get Data");
        }

        if (obj.responseType == "playbacks") {



            if (obj.responseSubType == 3) {

                var j = 63;

                for (k = 0; k < 6; k++) {
                    for (i = 0; i < 8; i++) {
                        var m = 3;
                        if (obj.itemGroups[k].items[i][0].isRun == 1) {
                            m = 1 + blackout;
                        } else if ((obj.itemGroups[k].items[i][0].i.c) == "#000000") {
                            m = 0
                        } else {
                            m = 5;
                        }

                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: 0 });
                        }
                        j = j - 1;
                    }
                }
            }


            if (obj.responseSubType == 2) {

                j = 71;

                for (i = 0; i < 8; i++) {//faders dots
                    m = 0;
                    if (obj.itemGroups[0].items[i][0].isRun == 1) {
                        m = 1 + blackout;
                    } /*else if ((obj.itemGroups[0].items[i][0].i.c) == "#000000") {
                        m = 0
                    } else { m = 1; }*/
                    if (ledmatrix[j] != m) {
                        ledmatrix[j] = m;
                        output.send('noteon', { note: j, velocity: m, channel: 0 });
                    }

                    if (faderbuttons == "LO") {//display faders lower buttons 
                        if (obj.itemGroups[0].items[i][0].isRun == 1) {
                            m = 1 + blackout;
                        } else if ((obj.itemGroups[0].items[i][0].i.c) == "#000000") {
                            m = 0
                        } else { m = 3; }

                        if (ledmatrix[j - 64] != m) {
                            ledmatrix[j - 64] = m;
                            output.send('noteon', { note: j - 64, velocity: m, channel: 0 });
                        }

                        if (m == 1) m = 3;

                        if (ledmatrix[j - 56] != m) {
                            ledmatrix[j - 56] = m;
                            output.send('noteon', { note: j - 56, velocity: m, channel: 0 });
                        }

                    }



                    j = j - 1;


                }


                if (faderbuttons == "HI") {
                    j = 15;
                    for (i = 0; i < 8; i++) {//upper fader exec

                        if (obj.itemGroups[1].items[i][0].isRun == 1) {
                            m = 1 + blackout;
                        } else if ((obj.itemGroups[1].items[i][0].i.c) == "#000000") {
                            m = 0
                        } else { m = 5; }
                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: 0 });
                        }
                        j = j - 1;
                    }
                    for (i = 0; i < 8; i++) {
                        if (obj.itemGroups[2].items[i][0].isRun == 1) {
                            m = 1 + blackout;
                        } else if ((obj.itemGroups[2].items[i][0].i.c) == "#000000") {
                            m = 0
                        } else { m = 5; }
                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            output.send('noteon', { note: j, velocity: m, channel: 0 });
                        }
                        j = j - 1;
                    }
                }
            }
        }
    }
};
