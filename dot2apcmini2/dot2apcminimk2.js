// ***********************************************************************
// ***   dot2 Akai APC mini mk2 control code v 1.6.0 by hfuerst (HF)   ***
// ***********************************************************************
//fork from
//dot2 Akai APC mini mk2 control code v 1.5.1 by ArtGateOne

var easymidi = require('easymidi');
var W3CWebSocket = require('websocket')
    .w3cwebsocket;

////////////////////////////////////////////////////////////////////////////////
//config 

var ipaddress = "localhost"; 
// You can change localhost(127.0.0.1) to Your console IP address
// default Login:
// username: remote
// password: remote
// password is md5-hashed, don't change it !!!
//
// https://www.md5hashgenerator.com/
// 'remote' -> '2c18e486683a3db1e645ad8523223b72'

wing          = 2;  //set wing 
                    // 0(core fader + b-wing 1),
                    // 1(f-wing 1 + b-wing 1),
                    // 2(f-wing 2 + b-wing 2),

wingselect    = 1;  //set wing select mode: 0 = off, 1 = on 
                    //(Switch between wing 1 and 2 with 'DRUM'-Button)
                    // Works not, if above selected wing = 0 (core fader) !!!
                    // -> !!! Beta State !!! // ToDo HF

pageselect    = 1;   //set page select mode - 0 - off, 1 - only exec buttons, 2 - exec buttons and faders together

midi_in1      = 'APC mini mk2';     //set correct midi in device name  -> You can see available Devices after start
midi_out1     = 'APC mini mk2';     //set correct midi out device name -> You can see available Devices after start
midi_in2      = 'none';             // (none = not used)
midi_out2     = 'none';             // (none = not used)

brightness    = 6;  //led brightness 0-6 (default = 4, blink = 8) 
darkmode      = 0;  //new color mode 1 - ON , 0 - OFF
colorpage     = 0;  //select page to display colors (1- 5), default 0 = off (not needed with autocolor)
autocolor     = 1;  //get color from Executor name (works actually not on Core-Faderbuttons)
activeblink   = 1;  //on active Executor use: 0 -> Color3 (c3/f3), 1 -> Blink Color2 (c2/f2 = button OFF but used)

////////////////////////////////////////////////////////////////////////////////
//global variables
var client = new W3CWebSocket('ws://'+ipaddress+':80/'); 

var PauseButtonCommand = "DefGoPause";
var GoMinusButtonCommand = "DefGoBack";
var GoPlusButtonCommand = "DefGoForward";
var MasterLeftFaderCommand = "SpecialMaster 1.1 At";  // -> Value in %
var MasterRightFaderCommand = "SpecialMaster 1.2 At"; // -> Value in %

// notice by HF 
//Masterfader  = "SpecialMaster 2.1 At"     -> Value in %
//BlackoutOn   = "SpecialMaster 2.1 At 0"   -> Value in %
//BlackoutOff  = "SpecialMaster 2.1 At 100" -> Value in %
//Masterspeed1 = "SpecialMaster 3.1 At"     -> value in BPM
//Masterspeed2 = "SpecialMaster 3.2 At"     -> value in BPM
//Masterspeed3 = "SpecialMaster 3.3 At"     -> value in BPM
//Masterspeed4 = "SpecialMaster 3.4 At"     -> value in BPM

var c1 = 0; //Color executor empty (default 0 = Black)
var c2 = 9; //color executor OFF (default 9 = Orange)
var c3 = 21; //color executor ON  (default 21 = Green)
var ufb1 = 0; //Upper Faderbutton Color executor empty (default 0 = Black)
var ufb2 = 108; //Upper Faderbutton color executor OFF (default 9 = Orange, 108 = CTB)
var ufb3 = 21; //Upper Faderbutton color executor ON  (default 21 = Green)
var f1 = 0; //Color fader button empty (default 0 = Black)
var f2 = 93; //color fader button OFF (default 9 = Orange, 93 = CTO)
var f3 = 42; //color fader button ON  (default 21 = Green, 42 = lightblue)
//var palete = [53, 45, 37, 21, 13, 9, 5, 3]; //palete colors <----
var palete = [53, 45, 37, 21, 13, 96, 5, 3]; //palete colors <----
var MasterSpeedColor = 76; // color upper faderbutton (default: 76 , maybe 19 or 69 or 80?)

// Original:
//Colornames: Double Words before Single Words, and 2 Letters at the end !!!  (White = 3, Warm = 8, Rose = 4, Citron = 73)
//var colornames = ['Center', 'XPos', 'Pos', 'PEff', 'Eff', 'Black', 'Warm', 'White', 'Deep Red', 'Light Red', 'Red', 'Rot', 'Light Orange', 'Orange', 'Light Yellow', 'Yellow', 'Gelb', 'Fern Green', 'Sea Green', 'Light Green', 'Green', 'Grün', 'Light Cyan', 'Cyan', 'Lavender', 'Light Bl', 'Blue', 'Blau', 'Light Vi', 'Violet', 'Light Mag', 'Magenta', 'Pink', 'CTO', 'CTB', 'Grey', 'Gr', 'Sw', 'Ws', 'Wm', 'Rt', 'Or', 'Ge', 'Gn', 'Tk', 'Cy', 'Bl', 'Vi', 'Ma', 'Pk', 'Solid', 'WLED', 'W', '-P'];
//var colorcodes = [      74,     75,    73,    76,     58,     119,      8,       3,        121,         56,     5,     5,             108,        9,             12,       13,     13,           17,          25,           110,      21,     21,           32,     33,         41,         36,     45,     45,        48 ,       49,          52,      53,     57,   108,    93,      1,    1,    0,    3,    8,    5,    9,   13,   21,   33,   33,   45,   49,   53,   57,      78,     42,  42,   28];

var colorNameCodes = [
    // by HF
    // long Names must be first, because of Search-Algorithm
    // Double Words before Single Words
    // NOT case sensitive !!  (Here only for easyier reading)

    // Effects
    ['PEff', 76],   // Position Effect (Phaser): 76 = darkGreen
    ['PosEff', 76],
    ['PFX', 76],
    ['PosFX',76],
    ['Eff', 58],    // Color or Dimmer Effect (Phaser): 58 = darkPink
    ['FX', 58],     
    
    // Positions:
    ['Center', 74], // Center Position: 74 = YellowGreen
    ['XPos', 75],   // Extra Position (mostly with Super Priority): 75 = intens Green
    ['Pos', 73],    // Normal Position: 73 = lightGreen

    // MA Colors: 
    // long Names must be first, because of Search-Algorithm
    // (shortcuts follow later)
    ['Black', 119],         // Blackout: 119 = lightCyanWhite
    ['Warm', 8],            // Warm White: 8 = WarmWhite
    ['White', 3],           // 3 = White
    ['Deep Red', 121],      // 121 = darkRed
    ['Light Red', 56],      // 56 = lightRed
    ['Red', 5],             // Red 
    ['Rot', 5],             // Red (German)
    ['Light Orange', 108],  // Light Orange
    ['Orange', 9],          // Orange (German same Word)
    ['Light Yellow', 12],   // Light Yellow
    ['Yellow', 13],         // Yellow
    ['Gelb', 13],           // Yellow (German)
    ['Fern Green', 17],     // Fern Green
    ['Sea Green', 25],      // Sea Green
    ['Light Green', 110],   // Light Green
    ['Green', 21],          // Green
    ['Grün', 21],           // Green (German)
    ['Light Cyan', 32],     // Light Cyan
    ['Cyan', 33],           // Cyan
    ['Lavender', 41],       // Lavender
    ['Light Bl', 36],       // Light Blue
    ['Blue', 45],           //
    ['Blau', 45],           // Blue (German)
    ['Light Vi', 48],       // Light Violett
    ['Violet', 49],         // 
    ['Light Mag', 52],      // Light Magenta
    ['Magenta', 53],        //
    ['Pink', 57],           //
    ['CTO', 108],           // CTO Gel = warm
    ['CTB', 93],            // CTB Gel = cold 
    ['Gray', 1],            // Gray
    
    // Shortcuts 
    // short Names must be last ins this Array!!!
    // dot2-labels must be longer than 3 signs to be found here, 
    // so it is nessessary to have a leading 'Space' before or after the following shortcuts
    // Example: "Singer or" = Singer orange Color

    // DIN 47002 Shortcuts 
    ['sw', 0],  // Schwarz  / Black
    ['br', 126],// Braun    / Brown
    ['ws', 3],  // Weiß     / White
    ['rt', 5],  // Rot      / Red
    ['or', 9],  // Orange   
    ['ge', 13], // Gelb     / Yellow
    ['gn', 21], // Grün     / Green
    ['cy', 33], // Cyan
    ['tk', 33], // Türkis   / Turquoise (same as Cyan)
    ['bl', 45], // Blau     / Blue
    ['vi', 49], // Violett  / violet
    ['gr', 1],  // Grau     / Gray
    ['ma', 53], // Magenta
    ['rs', 57], // Rosa     / Pink

    ['wm', 8],  // Warm (not DIN)

    // IEC 60757 Shortcuts 
    ['BK', 0],  // Black
    ['BN', 126],// Brown
    ['WH', 3],  // White
    ['RD', 5],  // Rot      / Red
    ['OG', 9],  // Orange   
    ['YE', 13], // Gelb     / Yellow
    ['GN', 21], // Grün     / Green
    ['TQ', 33], // Türkis   / Turquoise (sams as Cyan)
    ['BU', 45], // Blau     / Blue
    ['VT', 49], // Violett  / violet
    ['GY', 1],  // Gray
    ['PK', 57], // Pink

    // Specials
    ['Solid', 78],      // Solid WLEDs: 78 = Light GreenBlue
    ['WLED', 42],       // WLED: 42 = dark GreenBlue
    ['Master Speed 1', 58],  // Masterspeed 1 -> Color Effects : redViolet
    ['Master Speed 2', 76],  // Masterspeed 2 -> Position Effects : darkGreen
    ['Alle', 36],        // Select All (don't use 'all' because inside the Word 'Ball' or 'football')

    // Ultra-Shortcuts 
    // recommend to use as first sign in dot2 label !!! 
    // Must be followed by an Space
    // Example: 'W intensity'
    // Bad Example: 'W red' -> will be red
    ['W', 42],  // WLEDs

    // Array End
    [' ', ufb2]   // Space label use color of 'upperFaderbutton Off'
];

/******************************************************************************/

if (darkmode === 1) {
    var c1 = 0;
    var c2 = 1;
    var c3 = 21;
    var f1 = 0;
    var f2 = 1;
    var f3 = 5;  // 4 = rose (default = 5 red)
}
var blackout = 0; //0 = off, 1 = on
colorpage = colorpage - 1;
var pageIndex = 0;
var pageIndex2 = 0; //default page for faders (0 = page 1, 1 = page 2 .....) if u dont use page select mode 2
var channel = 6;
var faderbuttons = "LO";
var request = 0;
var interval_on = 0;
var session = 0;
var exec = JSON.parse('{"index":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,4,3,2,1,0,66,66,66,66,66],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,12,11,10,9,8,7,6,66],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,20,19,18,17,16,15,14,66]]}');
var ledmatrix = [0, 0, 0, 0, 0, 0, 0, 0,
                 0, 0, 9, 0, 9, 9, 9, 0, 
                 0, 0, 0, 0, 9, 0, 0, 0, 
                 0, 0, 0, 0, 0, 9, 0, 0,    // .2  (upside down)
                 0, 0, 0, 0, 0, 0, 9, 0, 
                 0, 0, 0, 0, 9, 0, 9, 0, 
                 0, 0, 0, 0, 0, 9, 0, 0, 
                 0, 0, 0, 0, 0, 0, 0, 0, 
                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var faderValue = [0, 0, 0, 0, 0.002, 0.006, 0.01, 0.014, 0.018, 0.022, 0.026, 0.03, 0.034, 0.038, 0.042, 0.046, 0.05, 0.053, 0.057, 0.061, 0.065, 0.069, 0.073, 0.077, 0.081, 0.085, 0.089, 0.093, 0.097, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12, 0.124, 0.128, 0.132, 0.136, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44, 0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1, 1];
var mfaderValue = [0, 0, 0.8, 1.6, 2.4, 3.2, 4, 4.8, 5.6, 6.4, 7.2, 8, 8.8, 9.6, 10.4, 11.2, 12, 12.8, 13.6, 14.4, 15.2, 16, 16.8, 17.6, 18.4, 19.2, 20, 20.8, 21.6, 22.4, 23.2, 24, 24.8, 25.6, 26.4, 27.2, 28, 28.8, 29.6, 30.4, 31.2, 32, 32.8, 33.6, 34.4, 35.2, 36, 36.8, 37.6, 38.4, 39.2, 40, 40.8, 41.6, 42.4, 43.2, 44, 44.8, 45.6, 46.4, 47.2, 48, 48.8, 49.6, 50.4, 51.2, 52, 52.8, 53.6, 54.4, 55.2, 56, 56.8, 57.6, 58.4, 59.2, 60, 60.8, 61.6, 62.4, 63.2, 64, 64.8, 65.6, 66.4, 67.2, 68, 68.8, 69.6, 70.4, 71.2, 72, 72.8, 73.6, 74.4, 75.2, 76, 76.8, 77.6, 78.4, 79.2, 80, 80.8, 81.6, 82.4, 83.2, 84, 84.8, 85.6, 86.4, 87.2, 88, 88.8, 89.6, 90.4, 91.2, 92, 92.8, 93.6, 94.4, 95.2, 96, 96.8, 97.6, 98.4, 99.2, 100, 100];
var faderValueMem = [0, 0, 0];  // index = midi CC Controller number (from APCminiMK2)
var ledvelocity = [0, 0, 0];
var faderTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const NS_PER_SEC = 1e9;
var lmn = 0;

/******************************************************************************/

if (wing == 0) {
    faderValueMem[56] = 127; // 56: APCminMK2-Masterfader
} else if (wing == 1) {
    faderValueMem[56] = 127; // 56: APCminMK2-Masterfader
} else if (wing == 2) {
    ;
}

// index of executors = dot2 Executornumber-1
var fbuttons = [    5, 4, 3, 2, 1, 0, 0, 0, 
                    5, 4, 3, 2, 1, 0, 0, 0];
var buttons = [ 205, 204, 203, 202, 201, 200, 200, 200, 
                105, 104, 103, 102, 101, 100, 100, 100, 
                807, 806, 805, 804, 803, 802, 801, 800, 
                707, 706, 705, 704, 703, 702, 701, 700, 
                607, 606, 605, 604, 603, 602, 601, 600, 
                507, 506, 505, 504, 503, 502, 501, 500, 
                407, 406, 405, 404, 403, 402, 401, 400, 
                307, 306, 305, 304, 303, 302, 301, 300];

var fbuttons0 = [   5, 4, 3, 2, 1, 0, 0, 0, 
                    5, 4, 3, 2, 1, 0, 0, 0];
var buttons0 = [205, 204, 203, 202, 201, 200, 200, 200, 
                105, 104, 103, 102, 101, 100, 100, 100, 
                807, 806, 805, 804, 803, 802, 801, 800, 
                707, 706, 705, 704, 703, 702, 701, 700, 
                607, 606, 605, 604, 603, 602, 601, 600, 
                507, 506, 505, 504, 503, 502, 501, 500, 
                407, 406, 405, 404, 403, 402, 401, 400, 
                307, 306, 305, 304, 303, 302, 301, 300];

var fbuttons1 = [   13, 12, 11, 10, 9, 8, 7, 6, 
                    13, 12, 11, 10, 9, 8, 7, 6];
var buttons1 = [213, 212, 211, 210, 209, 208, 207, 206, 
                113, 112, 111, 110, 109, 108, 107, 106, 
                807, 806, 805, 804, 803, 802, 801, 800, 
                707, 706, 705, 704, 703, 702, 701, 700, 
                607, 606, 605, 604, 603, 602, 601, 600, 
                507, 506, 505, 504, 503, 502, 501, 500, 
                407, 406, 405, 404, 403, 402, 401, 400, 
                307, 306, 305, 304, 303, 302, 301, 300];

var fbuttons2 = [   21, 20, 19, 18, 17, 16, 15, 14, 
                    21, 20, 19, 18, 17, 16, 15, 14];
var buttons2 = [221, 220, 219, 218, 217, 216, 215, 214, 
                121, 120, 119, 118, 117, 116, 115, 114, 
                815, 814, 813, 812, 811, 810, 809, 808, 
                715, 714, 713, 712, 711, 710, 709, 708, 
                615, 614, 613, 612, 611, 610, 609, 608, 
                515, 514, 513, 512, 511, 510, 509, 508, 
                415, 414, 413, 412, 411, 410, 409, 408, 
                315, 314, 313, 312, 311, 310, 309, 308];

setButtons(wing);


for (i = 48; i <= 56; i++) { //fader time set
    faderTime[i] = process.hrtime();
}



////////////////////////////////////////////////////////////////////////////////
/////////////////////            Application        ////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//clear terminal
console.clear(); 

//display info
console.log("********************************************");
console.log("   Akai APC mini mk2 -> dot2 WING: " + wing);
console.log("********************************************");
console.log("");

////////////////////////////////////////////////////////////////////////////////////////
// Easy Midi Start

var easymidi = require('easymidi');

// Check if any Midi-Device available
const inputs = easymidi.getInputs();
if (inputs.length <= 0) {
	console.log('==========> No midi input device found <==========');
	process.exit(1);
}
const outputs = easymidi.getOutputs();
if (outputs.length <= 0) {
	console.log('==========> No midi output device found <==========');
	process.exit(1);
}

//----------  open midi device 1  ----------
console.log("\nConnecting to midi device 1: ");
// Input 1
for (i=0; i<inputs.length; i++){
	//console.log(i+': '+inputs[i]);
	if (inputs[i] == midi_in1){
		var midiInput1 = new easymidi.Input(midi_in1);
		console.log("midi_in1....: " + midi_in1 );

		break; // exit for-loop
	}
	else if (i >= inputs.length-1){
		console.log('Error:\n===> midi input device \''+midi_in1+'\' not found <===\n');
		//display all midi devices
		console.log('available MIDI inputs:');
		console.log(inputs);
		process.exit(1);
	}
}
// Output 1
for (i=0; i<outputs.length; i++){
	//console.log(i+': '+outputs[i]);
	if (outputs[i] == midi_out1){
		var midiOutput1 = new easymidi.Output(midi_out1);
		console.log("midi_out1...: " + midi_out1 );
		break; // exit for-loop
	}
	else if (i >= outputs.length-1){
		console.log('Error:\n===> midi output device \''+midi_out1+'\' not found <===\n');
		//display all midi devices
		console.log('available MIDI outputs:');
		console.log(outputs);
		if (midi_out2 == 'none') {
			process.exit(1);
		}
	}
}

//----------  open midi device 2  ----------
console.log();
if (midi_in2 == 'none'){
    console.log('midi device 2 not used')
}
else {
	console.log("Connecting to midi device 2: ");
	// Input 2
	for (i=0; i<inputs.length; i++){
		//console.log(i+': '+inputs[i]);
		if (inputs[i] == midi_in2){
			var midiInput1 = new easymidi.Input(midi_in2);
			console.log("midi_in2....: " + midi_in2 );
			break; // exit for-loop
		}
		else if (i >= inputs.length-1){
			console.log('\n===> midi device \''+midi_in2+'\' not found <===\n');
			//display all midi devices
			console.log('available MIDI inputs:');
			console.log(inputs);
			process.exit(1);
		}
	}
	// Output 2
	for (i=0; i<outputs.length; i++){
		//console.log(i+': '+outputs[i]);
		if (outputs[i] == midi_out2){
			var midiOutput2 = new easymidi.Output(midi_out2);
			console.log("midi_out2...: " + midi_out2 );
			break; // exit for-loop
		}
		else if (i >= outputs.length-1){
			console.log('\n===> midi output device \''+midi_out2+'\' not found <===\n');
			//display all midi devices
			console.log('available MIDI outputs:');
			console.log(outputs);
			process.exit(1);
		}
	}	
}


//var input = new easymidi.Input(midi_in);
//var midiInput1 = new easymidi.Input(midi_in1);

//console.log("midi_out1: " + midi_out1 );
//var midiOutput1 = new easymidi.Output(midi_out1);
console.log("--------------------------------------------\n");


// ToDo HF:
// Check midiport open -> maybe reopen nessessary?
// Info - NPM easymidi uses NPM midi:
// https://www.npmjs.com/package/midi?activeTab=code
// use: if (midiInput1.isPortOpen()){}; ???

////////////////////////////////////////////////////////////////////////////////////////

sleep(1000, function () {
    // executes after one second, and blocks the thread
});
 
////////////////////////////////////////////////////////////////////////////////////////
// Turn off LEDs 100-107 = Track Buttons, 112-119 = Scene Buttons

for (i = 100; i < 120; i++) { 
    midiOutput1.send('noteon', { note: i, velocity: 0, channel: 0 });
}

////////////////////////////////////////////////////////////////////////////////////////
//clear led matrix and led status - display Number of device on 2 APCminis

for (i = 0; i < 120; i++) {
    midiOutput1.send('noteon', { note: i, velocity: ledmatrix1[i], channel: brightness });
    sleep(10, function () { });
}
if (midi_in2 != 'none'){
	for (i = 0; i < 120; i++) {
		midiOutput2.send('noteon', { note: i, velocity: ledmatrix2[i], channel: brightness });
		sleep(10, function () { });
	}
}


////////////////////////////////////////////////////////////////////////////////////////
//turn on page select buttons: 
//Scene Buttons 'Clip Stop', 'Solo', 'Mute', 'Rec Arm', 'Select'
if (pageselect > 0) {
    midiOutput1.send('noteon', { note: 112, velocity: 127, channel: 0 });
    midiOutput1.send('noteon', { note: 113, velocity: 0, channel: 0 });
    midiOutput1.send('noteon', { note: 114, velocity: 0, channel: 0 });
    midiOutput1.send('noteon', { note: 115, velocity: 0, channel: 0 });
    midiOutput1.send('noteon', { note: 116, velocity: 0, channel: 0 });
}

////////////////////////////////////////////////////////////////////////////////////////
//turn on wing select LEDs: 
//Scene Button "Drum"
// by HF
if (wingselect > 0 && wing == 2) {
    midiOutput1.send('noteon', { note: 117, velocity: 127, channel: 0 });
    }
else {
    midiOutput1.send('noteon', { note: 117, velocity: 0, channel: 0 });
}

////////////////////////////////////////////////////////////////////////////////////////
//turn on led buttons
//Scene Buttons 'Note', 'Stop all Clips'
midiOutput1.send('noteon', { note: 118, velocity: 0, channel: 0 });//fader buttons select HI
midiOutput1.send('noteon', { note: 119, velocity: 127, channel: 0 });//fader buttons select LO


////////////////////////////////////////////////////////////////////////////////////////
//color Go+ Go- Pause buttons
if (wing == 0) {
    if (darkmode == 1) {
        midiOutput1.send('noteon', { note: 6, velocity: 0, channel: brightness });//off
        midiOutput1.send('noteon', { note: 7, velocity: 1, channel: brightness });//Mid button
        midiOutput1.send('noteon', { note: 14, velocity: 0, channel: brightness });//off
        midiOutput1.send('noteon', { note: 15, velocity: 1, channel: brightness });//Top button
        midiOutput1.send('noteon', { note: 107, velocity: 127, channel: 0 });// dot - Go button
    }
    else {
        midiOutput1.send('noteon', { note: 6, velocity: 0, channel: brightness });//off
        midiOutput1.send('noteon', { note: 7, velocity: 21, channel: brightness });//Mid button
        midiOutput1.send('noteon', { note: 14, velocity: 0, channel: brightness });//off
        midiOutput1.send('noteon', { note: 15, velocity: 45, channel: brightness });//Top button
        midiOutput1.send('noteon', { note: 107, velocity: 127, channel: 0 });// dot - Go button
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
// Midi Note On Messages
// Buttons Pressed

//midiInput1.on('noteon', msg => console.log('noteon - note: '+msg.note+'  velocity: '+msg.velocity+'  channel: '+msg.channel));
midiInput1.on('noteon', function (msg) {

    if (msg.note >= 0 && msg.note <= 15 && wing == 0) { // Buttons lower 2 lines @ wing 0
        if (msg.note == 6) {
            //do nothing
        }
        else if (msg.note == 7) {
            client.send('{"command":"' + GoMinusButtonCommand + '","session":' + session + ',"requestType":"command","maxRequests":0}');
        }
        else if (msg.note == 14) {
            //do nothing
        }
        else if (msg.note == 15) {
            client.send('{"command":"' + PauseButtonCommand + '","session":' + session + ',"requestType":"command","maxRequests":0}');
        }
        else if (faderbuttons == "HI") {
            client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
        } else {
            if (msg.note < 8) {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":1,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + fbuttons[msg.note] + ',"pageIndex":' + pageIndex2 + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
            }
        }
    }

    else if (msg.note >= 0 && msg.note <= 15) { // Buttons lower 2 lines @ wing 1+2
        //console.log('noteon - note: '+msg.note+'  velocity: '+msg.velocity+'  channel: '+msg.channel);
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

    else if (msg.note >= 16 && msg.note <= 63) {
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":true,"released":false,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    else if (msg.note >= 100 && msg.note <= 107) {
        if (msg.note == 106 && wing == 0) {
            //do nothing
        }
        else if (msg.note == 107 && wing == 0) {
            client.send('{"command":' + GoPlusButtonCommand + ',"session":' + session + ',"requestType":"command","maxRequests":0}');
        } else {
            client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.note - 52] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + 1 + ',"type":1,"session":' + session + ',"maxRequests":0}');
        }
    }

    else if (msg.note >= 112 && msg.note <= 116) {//page select
        if (pageselect == 1) {
            midiOutput1.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            midiOutput1.send('noteon', { note: (msg.note), velocity: 1, channel: 0 });
        }
        else if (pageselect == 2) {
            midiOutput1.send('noteon', { note: (pageIndex + 112), velocity: 0, channel: 0 });
            pageIndex = msg.note - 112;
            pageIndex2 = msg.note - 112;
            midiOutput1.send('noteon', { note: (msg.note), velocity: 1, channel: 0 });
        }

    }

    else if (msg.note == 117) {//wing select
        // by HF
        //console.log ('MIDI-Note 117: --- Wing Select ---')
        if (wingselect == 1){
            if (wing == 1) {
                //console.log ('Wing 1 -> 2');
                wing = 2;
                midiOutput1.send('noteon', { note: 117, velocity: 127, channel: 0 });
                setButtons(wing);
            }
            else if (wing == 2) {
                //console.log ('Wing 2 -> 1');
                wing = 1;
                midiOutput1.send('noteon', { note: 117, velocity: 0, channel: 0 });
                setButtons(wing);
            }    
        }
    }

    else if (msg.note == 118) {//fader buttons HI
        faderbuttons = "HI";
        midiOutput1.send('noteon', { note: 118, velocity: 127, channel: 0 });
        midiOutput1.send('noteon', { note: 119, velocity: 0, channel: 0 });
    }
    else if (msg.note == 119) {//fader buttons LO
        faderbuttons = "LO";
        midiOutput1.send('noteon', { note: 118, velocity: 0, channel: 0 });
        midiOutput1.send('noteon', { note: 119, velocity: 127, channel: 0 });
    }

    else if (msg.note == 122) {//Shift Button
        if (wing == 1 || wing == 0) {
            // Blackout (On)
            client.send('{"command":"SpecialMaster 2.1 At 0","session":' + session + ',"requestType":"command","maxRequests":0}');
            blackout = 1;
        } else if (wing == 2) {
            // MasterSpeed 1 Learn
            client.send('{"command":"Learn SpecialMaster 3.1","session":' + session + ',"requestType":"command","maxRequests":0}');
        }
    }


});

/////////////////////////////////////////////////////////////////////////////////////////
// Midi Note Off Messages
// Buttons released
// send requests to dot2 
// -> client.onmessage below will be triggered on response

midiInput1.on('noteoff', function (msg) {


    if (msg.note >= 0 && msg.note <= 15 && wing == 0) {
        if (msg.note == 6) {
            //do nothing
        }
        else if (msg.note == 7) {
            //do nothing
        }
        else if (msg.note == 14) {
            //do nothing
        }
        else if (msg.note == 15) {
            //do nothing
        }
        else
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

    else if (msg.note >= 0 && msg.note <= 15) { // Buttons Lower 2 Lines
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

    else if (msg.note >= 16 && msg.note <= 63) { // Buttons upper 6 lines
        client.send('{"requestType":"playbacks_userInput","cmdline":"","execIndex":' + buttons[msg.note] + ',"pageIndex":' + pageIndex + ',"buttonId":0,"pressed":false,"released":true,"type":0,"session":' + session + ',"maxRequests":0}');
    }

    else if (msg.note >= 100 && msg.note <= 107) {
        if (msg.note == 106 && wing == 0) {
            //do nothing
        }
        else if (msg.note == 107 && wing == 0) {
            //do nothing
        } else {
            client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.note - 52] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[faderValueMem[msg.note - 52]] + ',"type":1,"session":' + session + ',"maxRequests":0}');
        }
    }

    else if (msg.note == 122) {//Shift Button
        if (wing == 1 || wing == 0) {
            // Blackout (Off)
            client.send('{"command":"SpecialMaster 2.1 At ' + mfaderValue[faderValueMem[56]] + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            blackout = 0;
        }
    }

});

/////////////////////////////////////////////////////////////////////////////////////////
// Midi Common Control Messages
// Faders

midiInput1.on('cc', function (msg) {
    diff = process.hrtime(faderTime[msg.controller]);
    if ((diff[0] * NS_PER_SEC + diff[1]) >= 50000000 || msg.value == 0 || msg.value == 127) {

        faderTime[msg.controller] = process.hrtime();

        faderValueMem[msg.controller] = msg.value;

        if (wing == 0) {
            if (msg.controller == 54) { //MASTER FADER LEFT
                client.send('{"command":"' + MasterLeftFaderCommand + " " + (mfaderValue[msg.value]) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            } else if (msg.controller == 55) {//MASTER FADER RIGHT
                client.send('{"command":"' + MasterRightFaderCommand + " " + (mfaderValue[msg.value]) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            } else if (msg.controller == 56) {// GRAND MASTER FADER
                client.send('{"command":"SpecialMaster 2.1 At ' + (mfaderValue[msg.value]) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
            }

        }


        else if (wing == 1) {
            if (msg.controller == 56) {
                if (blackout == 0) {
                    client.send('{"command":"SpecialMaster 2.1 At ' + (mfaderValue[msg.value]) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
                }
            } else {
                client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
            }

        }

        else if (wing == 2) {
            if (msg.controller == 56) {
                // MasterSpeed 1
                client.send('{"command":"SpecialMaster 3.1 At ' + (faderValue[msg.value] * 225) + '","session":' + session + ',"requestType":"command","maxRequests":0}');
            } else {
                client.send('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
                
                // ToDo HF 
                // log send fader to dot2
                // console.log('{"requestType":"playbacks_userInput","execIndex":' + exec.index[wing][msg.controller] + ',"pageIndex":' + pageIndex2 + ',"faderValue":' + faderValue[msg.value] + ',"type":1,"session":' + session + ',"maxRequests":0}');
            }
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
//WEBSOCKET-------------------

console.log("Connecting to dot2 IP-Address: "+ipaddress+" ...");

client.onerror = function () {
    console.log('Connection Error');
};

/////////////////////////////////////////////////////////////////////////////////////////
client.onopen = function () {
    console.log('WebSocket Client Connected');

    //send random number to dot2 
    function sendNumber() {
        if (client.readyState === client.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            client.send(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    //sendNumber();
    //// not used, for ArtgateOne debugging??? 
};

/////////////////////////////////////////////////////////////////////////////////////////
// dot2 closed

client.onclose = function () {
    console.log('Client Closed');
    for (i = 0; i < 120; i++) {
        midiOutput1.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    midiInput1.close();
    midiOutput1.close();
    process.exit();
    // END
};

/////////////////////////////////////////////////////////////////////////////////////////
//dot2 sends something
client.onmessage = function (e) {

    if (request >= 9) {
        client.send('{"session":' + session + '}');
        client.send('{"requestType":"getdata","data":"set","session":' + session + ',"maxRequests":1}');
        request = 0;
    }

    if (typeof e.data == 'string') {
        //console.log("Received: '" + e.data + "'");
        //console.log(e.data);


        obj = JSON.parse(e.data);
        //console.log(obj);
        //console.log(JSON.stringify(obj));  // ToDo HF


        if (obj.status == "server ready") {
            console.log("SERVER READY");
            client.send('{"session":0}')
        }
        if (obj.forceLogin == true) {
            console.log("LOGIN with Password 'remote' ...");
            session = (obj.session);
            client.send('{"requestType":"login","username":"remote","password":"2c18e486683a3db1e645ad8523223b72","session":' + obj.session + ',"maxRequests":10}')
            // https://www.md5hashgenerator.com/
            // 'remote' -> '2c18e486683a3db1e645ad8523223b72'
        }

        if (obj.session == 0) {
            console.log("CONNECTION ERROR");
            client.send('{"session":' + session + '}');
        }

        if (obj.session) {
            if (obj.session == -1) {
                console.log("Please turn on Web Remote, and set Web Remote password to \"remote\"");
                midiclear();
                midiInput1.close();
                midiOutput1.close();
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
            if (interval_on == 0) {
                interval_on = 1;
                setInterval(interval, 100);//80
            }
            console.log("...LOGIN Success");
            console.log("SESSION " + session);
        }

        /*
        if (obj.responseType == "presetTypeList") {
            //console.log("Preset Type List");
        }


        if (obj.responseType == "presetTypes") {
            //console.log("Preset Types");
        }

        if (obj.responseType == "getdata") {
            //console.log("Get Data");
        }
        */

        // =========================================================================================
        // =========================================================================================
        // =========================================================================================
        else if (obj.responseType == "playbacks") {

            request++;

            // =========================================================================================
            // Button-Wing  

            if (obj.responseSubType == 3) {

                var j = 63;

                // ----------------- COLOR PAGE ----------------------

                if (colorpage == pageIndex) {
                    for (k = 0; k < 6; k++) {
                        for (i = 0; i < 8; i++) {
                            var m = palete[i];
                            if (obj.itemGroups[k].items[i][0].isRun == 1) {
                                //Executor is ON
                                channel = 8;
                                if (darkmode == 1) {
                                    channel = brightness;
                                }
                            } else if ((obj.itemGroups[k].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                channel = 0;
                            } else {
                                // Executor is OFF
                                channel = brightness;
                                if (darkmode == 1) {
                                    channel = 0;
                                }
                            }

                            if (ledmatrix[j] != m || ledvelocity[j] != channel) {
                                ledmatrix[j] = m;
                                ledvelocity[j] = channel;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: channel });
                            }
                            j = j - 1;
                        }
                    }
                }

                // ----------------- AUTO COLOR ----------------------

                else if (autocolor == 1) {

                    for (k = 0; k < 6; k++) {
                        for (i = 0; i < 8; i++) {
                            //var m = palete[i];
                            var m = findColorIndex(obj.itemGroups[k].items[i][0].tt.t);
                            if (m != -1) {       // Colorname found
                                //m = colorcodes[m];
                                m = colorNameCodes[m][1];
                            }

                            if (obj.itemGroups[k].items[i][0].isRun == 1) {
                                //Executor is ON
                                channel = 8;
                                if (m == -1) {   // Colorname not Found
                                    if (activeblink == 1){
                                        m = c2;       //OFF-/Used-Color
                                        channel = 8;
                                    }
                                    else{
                                        m = c3;      // ON-Color = c3
                                        channel = brightness;
                                    }                                    
                                }
                                if (darkmode == 1) {
                                    channel = brightness;
                                }
                            }

                            else if ((obj.itemGroups[k].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                if (m == -1) {   // Colorname not Found
                                    m = c1;      // Not Used Color
                                }
                                channel = 0;
                            }

                            else {
                                // Executor is OFF
                                channel = brightness;
                                if (darkmode == 1) {
                                    channel = 0;
                                }
                                if (m == -1) {   // Colorname not Found
                                    m = c2;      // OFF Color
                                    channel = brightness;
                                }
                            }

                            if (ledmatrix[j] != m || ledvelocity[j] != channel) {
                                ledmatrix[j] = m;
                                ledvelocity[j] = channel;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: channel });
                            }
                            j = j - 1;
                        }
                    }
                }

                // ----------------- Standard COLOR ----------------------

                else {

                    for (k = 0; k < 6; k++) {
                        for (i = 0; i < 8; i++) {
                            var m = c1;
                            if (obj.itemGroups[k].items[i][0].isRun == 1) {
                                // Executor is ON
                                m = c3 + blackout; 
                                channel = brightness;
                                if (activeblink == 1){
                                    channel = 8;
                                }
                        } else if ((obj.itemGroups[k].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                m = c1
                                channel = brightness;
                            } else {
                                // Executor is OFF
                                m = c2;
                                channel = brightness;
                            }

                            if (ledmatrix[j] != m || ledvelocity[j] != channel) {
                                ledmatrix[j] = m;
                                ledvelocity[j] = channel;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: channel });
                            }
                            j = j - 1;
                        }
                    }
                }
            }


            // =========================================================================================
            // Fader-Wing 
            
            if (obj.responseSubType == 2) {

                
                if (wing == 0) {
                    /////////////////////////////////////////////////
                    // Wing 0
                    j = 69;

                    for (i = 0; i < 6; i++) {//faders dots
                        m = 0;
                        if (obj.itemGroups[0].items[i][0].isRun == 1) {
                            m = 127;
                        } 
                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            midiOutput1.send('noteon', { note: j + 36, velocity: m, channel: 0 });
                        }

                        if (faderbuttons == "LO") {//display faders lower buttons 
                            if (obj.itemGroups[0].items[i][0].isRun == 1) {
                                m = f3;
                            } else if ((obj.itemGroups[0].items[i][0].i.c) == "#000000") {
                                m = f1;
                            } else { m = f2; }

                            if (ledmatrix[j - 64] != m) {
                                ledmatrix[j - 64] = m;
                                midiOutput1.send('noteon', { note: j - 64, velocity: m, channel: brightness });
                            }

                            if (m == f2 || m == f3) m = f2;

                            if (ledmatrix[j - 56] != m) {
                                ledmatrix[j - 56] = m;
                                midiOutput1.send('noteon', { note: j - 56, velocity: m, channel: brightness });
                            }
                        }
                        j--;
                    }
                    if (faderbuttons == "HI") {
                        j = 13;
                        for (i = 0; i < 6; i++) {//upper fader exec

                            if (obj.itemGroups[1].items[i][0].isRun == 1) {
                                m = c3;
                            } else if ((obj.itemGroups[1].items[i][0].i.c) == "#000000") {
                                m = c1;
                            } else { m = c2; }
                            if (ledmatrix[j] != m) {
                                ledmatrix[j] = m;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: brightness });
                            }
                            j = j - 1;
                        }
                        j = 5;
                        for (i = 0; i < 6; i++) {
                            if (obj.itemGroups[2].items[i][0].isRun == 1) {
                                m = c3;
                            } else if ((obj.itemGroups[2].items[i][0].i.c) == "#000000") {
                                m = c1;
                            } else { m = c2; }
                            if (ledmatrix[j] != m) {
                                ledmatrix[j] = m;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: brightness });
                            }
                            j = j - 1;
                        }
                    }

                } else {
                    /////////////////////////////////////////////////
                    // Wing 1-2
                    j = 71;

                    for (i = 0; i < 8; i++) {  //faders dots
                        // -----------------------------------------
                        // Fader dots  (Track Buttons)
                        m = 0;
                        if (obj.itemGroups[0].items[i][0].isRun == 1) {
                            m = 127;
                        } /*else if ((obj.itemGroups[0].items[i][0].i.c) == "#000000") {
                        m = 0
                        } else { m = 1; }*/
                        if (ledmatrix[j] != m) {
                            ledmatrix[j] = m;
                            midiOutput1.send('noteon', { note: j + 36, velocity: m, channel: 0 });
                        }

                        // -----------------------------------------
                        //display faders lower buttons
                        if (faderbuttons == "LO") {  
                            if (obj.itemGroups[0].items[i][0].isRun == 1) {
                                // Executor is ON
                                m = f3;
                                channel = brightness;
                                if (activeblink == 1){
                                    channel = 8;   // Blink
                                    m = f2;
                                }
                                if (autocolor == 1) {
                                    // console.log (obj.itemGroups[0].items[i][0].tt.t);
                                    var ind = findColorIndex(obj.itemGroups[0].items[i][0].tt.t);
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                }  
                            } else if ((obj.itemGroups[0].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                m = f1;
                            } else { 
                                // Executor is OFF
                                m = f2; 
                                channel = brightness; 
                                if (autocolor == 1) {
                                    var ind = findColorIndex(obj.itemGroups[0].items[i][0].tt.t);  // ToDo HF
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                }  
                            }

                            // lower row of lower fader buttons (4)
                            // can be active in dot 2

                            lmn = j-64;
                            if (ledmatrix[lmn] != m || ledvelocity[lmn] != channel) {
                                ledmatrix[lmn] = m;
                                ledvelocity[lmn] = channel;
                                midiOutput1.send('noteon', { note: lmn, velocity: m, channel: channel });
                            }

                            // if (ledmatrix[j - 64] != m) {
                            //     mm = m;
                            //     ledmatrix[j - 64] = mm;
                            //     midiOutput1.send('noteon', { note: j - 64, velocity: mm, channel: channel });
                            // }

                            // upper row of lower fader buttons (3)
                            if (m == f3) { // can't be activ in dot2
                                m = f2;
                            }
                            channel = brightness;

                            if (autocolor == 1) {
                                var Search = 'Master Speed'.toLowerCase();
                                var buttonLabel = obj.itemGroups[0].items[i][0].tt.t.toLowerCase();
                                if (matchRuleExpl(buttonLabel, Search + "*")){
                                    m = MasterSpeedColor;
                                    channel = 7; // blink always Faster
                                    //console.log('Label: '+buttonLabel+', Search: '+Search+', m:'+m);
                                    //console.log(obj.itemGroups[0].items[i][0].tt.t);
                                    // BPM:
                                    //console.log('obj.itemGroups[0].items[i][0].cues.items[0].t);
                                    // ToDo?: Blink in real Speed BPM
                                }    
                            }

                            // send to LED
                            lmn = j-56;
                            if (ledmatrix[lmn] != m || ledvelocity[lmn] != channel) {
                                ledmatrix[lmn] = m;
                                ledvelocity[lmn] = channel;
                                midiOutput1.send('noteon', { note: lmn, velocity: m, channel: channel });
                            }
                        }
                        j = j - 1;
                    }

                    // -----------------------------------------
                    //display faders upper buttons
                    // ToDo HF Now

                    if (faderbuttons == "HI") {     
                        j = 15;
                        for (i = 0; i < 8; i++) { //upper upper fader exec (1)
                            channel = brightness;
                            changed = 0;
                            if (obj.itemGroups[1].items[i][0].isRun == 1) {
                                // Executor is ON
                                m = ufb3;
                                channel = brightness;
                                if (activeblink == 1){
                                     m = ufb2;
                                     channel = 8; // blink
                                }
                                if (autocolor == 1) {
                                    // console.log (obj.itemGroups[0].items[i][0].tt.t);
                                    var ind = findColorIndex(obj.itemGroups[1].items[i][0].tt.t);  // ToDo HF
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                } 
                            } else if ((obj.itemGroups[1].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                m = ufb1;
                            } else { 
                                // Executor is OFF
                                m = ufb2;
                                channel = brightness;
                                if (autocolor == 1) {
                                    var ind = findColorIndex(obj.itemGroups[1].items[i][0].tt.t);  // ToDo HF
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                }  

                            }

                            if (ledmatrix[j] != m || ledvelocity[j] != channel) {
                                ledmatrix[j] = m;
                                ledvelocity[j] = channel;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: channel });
                            }

                             // send to LED
                             lmn = j;
                             if (ledmatrix[lmn] != m || ledvelocity[lmn] != channel) {
                                 ledmatrix[lmn] = m;
                                 ledvelocity[lmn] = channel;
                                 midiOutput1.send('noteon', { note: lmn, velocity: m, channel: channel });
                             }
                            
                            j = j - 1;
                        }
                        for (i = 0; i < 8; i++) {   // lower line of upper fader exec (2)
                            channel = brightness;
                            if (obj.itemGroups[2].items[i][0].isRun == 1) {
                                // Executor is ON
                                m = ufb3;
                                if (activeblink == 1){
                                    m = ufb2;
                                    channel = 8;
                                }
                                if (autocolor == 1) {
                                    // console.log (obj.itemGroups[0].items[i][0].tt.t);
                                    var ind = findColorIndex(obj.itemGroups[2].items[i][0].tt.t);
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                } 
                            } else if ((obj.itemGroups[2].items[i][0].i.c) == "#000000") {
                                // Executor is not used
                                m = ufb1;
                            } else { 
                                // Executor is OFF
                                m = ufb2; 
                                channel = brightness;
                                if (autocolor == 1) {
                                    var ind = findColorIndex(obj.itemGroups[2].items[i][0].tt.t);  // ToDo HF
                                    if (ind != -1) {       // Colorname found
                                        //m = colorcodes[m];
                                        m = colorNameCodes[ind][1];
                                    }
                                    channel = brightness;
                                } 
                            }

                            if (ledmatrix[j] != m || ledvelocity[j] != channel) {
                                ledmatrix[j] = m;
                                ledvelocity[j] = channel;
                                midiOutput1.send('noteon', { note: j, velocity: m, channel: channel });
                            }
                            j = j - 1;
                        }
                    }
                }
            }
        }
        // =========================================================================================
        // =========================================================================================
        // =========================================================================================

    }
};


////////////////////////////////////////////////////////////////////////////////
/////////////////////             Functions         ////////////////////////////
////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//interval send data to server function
function interval() {   
    if (session > 0) {
    
        // keep dot2-connection open (use if no other requests)
    	//client.send('{"requestType":"getdata","data":"set","session":' + session + ',"maxRequests":1}');

        // request playbacks
        if (wing == 0) {
            client.send('{"requestType":"playbacks","startIndex":[300,400,500,600,700,800],"itemsCount":[8,8,8,8,8,8],"pageIndex":' + pageIndex + ',"itemsType":[3,3,3,3,3,3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[0,100,200],"itemsCount":[6,6,6],"pageIndex":' + pageIndex2 + ',"itemsType":[2,3,3],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');

        } else if (wing == 1) {
            client.send('{"requestType":"playbacks","startIndex":[300,400,500,600,700,800],"itemsCount":[8,8,8,8,8,8],"pageIndex":' + pageIndex + ',"itemsType":[3,3,3,3,3,3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[6,106,206],"itemsCount":[8,8,8],"pageIndex":' + pageIndex2 + ',"itemsType":[2,3,3],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');

        }
        else if (wing == 2) {
            client.send('{"requestType":"playbacks","startIndex":[308,408,508,608,708,808],"itemsCount":[8,8,8,8,8,8],"pageIndex":' + pageIndex + ',"itemsType":[3,3,3,3,3,3],"view":3,"execButtonViewMode":2,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
            client.send('{"requestType":"playbacks","startIndex":[14,114,214],"itemsCount":[8,8,8],"pageIndex":' + pageIndex2 + ',"itemsType":[2,3,3],"view":2,"execButtonViewMode":1,"buttonsViewMode":0,"session":' + session + ',"maxRequests":1}');
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//midi clear function
function midiclear() {
    for (i = 0; i < 120; i++) {
        ledmatrix[i] = 0;
        midiOutput1.send('noteon', { note: i, velocity: 0, channel: 0 });
        sleep(10, function () { });
    }
    return;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// find Colors

// Original
/*
function findColorIndex(colorName) {
    //const names = ['Black', 'White', 'Red', 'Orange', 'Yellow', 'Fern Green', 'Green', 'Sea Green', 'Cyan', 'Lavender', 'Blue', 'Violet', 'Magenta', 'Pink', 'CTO', 'CTB', 'Grey', 'Deep Red'];
    //const index = names.indexOf(colorName);
    const index = colornames.indexOf(colorName);
    return index;
}
*/

// by HF
function findColorIndex(colorName) {
    //const names = ['Black', 'White', 'Red*', 'Orange', 'Yellow', 'Fern Green', 'Green', 'Sea Green', 'Cyan', 'Lavender', 'Blue', 'Violet', 'Magenta', 'Pink', 'CTO', 'CTB', 'Grey', 'Deep Red'];
    //const index = names.indexOf(colorName);
    
    //---------------------------------------------------------------
    // Original
    //const index = colornames.indexOf(colorName);

    //------------------------------------
    // nocase only
    /*
    const index = arr.findIndex(
        item => colorName.toLowerCase() === colornames.toLowerCase()
    );
    return index;
    */
    
    //------------------------------------
    // nocase and Wildcard
    var buttonLabel = colorName.toLowerCase();
    var index = -1; 
    //for (n = 0; n < colornames.length; n++) {  
    //    var Search = colornames[n].toLowerCase();
    for (n = 0; n < colorNameCodes.length; n++) {  
        var Search = colorNameCodes[n][0].toLowerCase();
        //------------------------
        if (Search.length > 2 ){
                if (matchRuleExpl(buttonLabel, "*" + Search + "*")){
                    //
                    index = n;
                    break;
                }
        }
        //------------------------
        else {
            if (buttonLabel.length > 3){
                if (matchRuleExpl(buttonLabel, "*" + Search + "*")){
                    if (matchRuleExpl(buttonLabel, "* " + Search)){
                        //
                        index = n;
                        break;
                    };
                    if (matchRuleExpl(buttonLabel, Search + " *")){
                        //
                        index = n;
                        break;
                    };
                };
            }
            else{
                if (matchRuleExpl(buttonLabel, Search)){
                    //
                    index = n;
                    break;
                };
            }
        }
        //------------------------


        
        
        /*
        //debug
        if (colorName == "Mitte Zentriert"){
            console.log('');
            console.log('n............: '+n);
            //console.log('');
            console.log('colorName....: '+colorName);
            console.log('buttonLabel.: '+buttonLabel);
            //console.log('');
            console.log('colornames[n]: '+colornames[n]);
            console.log('Search.......: '+Search);
            console.log('index........: '+index+'\n\n');
            alert('stop');
        }
        */
        
    }

    
    
    return index;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// by HF

function setButtons(wing) {
    if (wing == 0) {
        faderValueMem[56] = 127;
        //fbuttons = [...fbuttons0];
        //buttons = [...buttons0];
        fbuttons = fbuttons0.slice();
        buttons = buttons0.slice();
    } else if (wing == 1) {
        faderValueMem[56] = 127;
        fbuttons = [...fbuttons1];
        buttons = [...buttons1];
    } else if (wing == 2) {
        fbuttons = [...fbuttons2];
        buttons = [...buttons2];
        //console.log(fbuttons.length, fbuttons0.length, fbuttons1.length, fbuttons2.length);
    }
}


////////////////////////////////////////////////////////////////////////////////
// find String
// found at
// https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript

function matchRuleExpl(str, rule) {
    // Returns a Boolean value that indicates whether or not a pattern exists in a searched string.

    // for this solution to work on any string, no matter what characters it has
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  
    // "."  => Find a single character, except newline or line terminator
    // ".*" => Matches any string that contains zero or more characters
    rule = rule.split("*").map(escapeRegex).join(".*");
  
    // "^"  => Matches any string with the following at the beginning of it
    // "$"  => Matches any string with that in front at the end of it
    rule = "^" + rule + "$"
  
    //Create a regular expression object for matching string
    var regex = new RegExp(rule);
  
    //Returns true if it finds a match, otherwise it returns false
    return regex.test(str);
  }
  /* Examples
    alert(
        "1. " + matchRuleExpl("bird123", "bird*") + "\n" +
        "2. " + matchRuleExpl("123bird", "*bird") + "\n" +
        "3. " + matchRuleExpl("123bird123", "*bird*") + "\n" +
        "4. " + matchRuleExpl("bird123bird", "bird*bird") + "\n" +
        "5. " + matchRuleExpl("123bird123bird123", "*bird*bird*") + "\n" +
        "6. " + matchRuleExpl("s[pe]c 3 re$ex 6 cha^rs", "s[pe]c*re$ex*cha^rs") + "\n" +
        "7. " + matchRuleExpl("should not match", "should noo*oot match") + "\n"
    );
  */

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
