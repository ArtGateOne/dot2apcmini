# dot2apcmini2
nodejs code to control dot2 software use Akai APCmini midi controller, and Akai APC mini MK2  

I (hfuerst) need further development for more colors labled in dot2 and played out on APCmini MK2. So i did it. Now, there are even more ideas. Maybe i will do them too, sometimes.

## Features
### Executor Buttons and Faders:  
- Upper 6 Lines of APCmini Buttons are Buttonwing-Buttons,  
- Lower 2 Lines of APCmini Buttons are lower Faderwing-Buttons at start.  
- Lower Faderwing-Buttons can be reached by Pressing 'STOP ALL CLIPS'.
- Upper Faderwing-Buttons can be reached by pressing 'NOTE'.
- The small Buttons above the Faders are always Flash of the Faders. Simply sending 100% Fadervalue while pressing.
- Fader simply do that they shall do. There is an issue with Faders by changing Wing if not at Zero, becase they have no Motors. So I decided to use then always on Page 1 by setting mode 'pageselect = 1;' in file config. look below or in file for further description.

### Pages and Wing-Numbers
- Select Wing in Config or (NEW in v1.6.0) Change Wing 1-2 with Button 'DRUM'
- Select Page 1-5 with upper 5 Buttons: 1- 'CLIP STOP', 2 - 'SOLO', 3 - 'MUTE', 4 - 'REC ARM', 5 - 'SELECT'. This is Working for 

### Colors
There are default Colors for Executor Buttons. Off = unused, warm = used but off, green = on.  

New Options (in file-config):

'autocolor   = 1;'         
Selects APCmini-Button-Colors from dot2 Executor Labels    
(OLD since v1.5.0) if Executor-Labels are exact form dot2 Color Swatchbook 'MA colors'.  
(NEW since v1.6.0) if Executor-Labels **include** a lot of keywords or shortcuts like Effect-Shortcuts, Position-Shortcuts, MA colors, DIN 47002 Shortcuts, IEC 60757 Shortcuts or Specials. At Shortcuts below 3 signs there must be a Space before or after the shortcut!!!     

'activeblink = 1;'   (since v1.6.0)     
Active Executors don't use default ON-color, now they blink in USED-Color if active. This is recommend for use with autocolor.


----------------------
Example of Position and FX-Colors    
here Page 2 'SOLO' and upper Faderbuttons 'NOTE' is in use    
(old Version v1.6.0.prealpha) 
![Example of Position and FX-Colors](https://github.com/hfuerst/dot2apcmini2/blob/main/images/v1.6.000-ZS-Wing2-Page2.jpg)

----------------------
## Install
- Download and install NODEJS version 14.17 from https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi
- Download my code inclusive folder 'node_modules'.

----------------------
## How to use

### Run
- run dot2 software
- turn on webremote (password remote)
- run from command prompt (win+R - cmd)
  - APCmini: `node dot2apcmini2.js`
  - APC mini MK2: `node dot2apcminimk2.js`

### Buttons on APC mini MK2
- Select Pages: 
--------------------
## Configuration

Edit file to config
-----
Find in `dot2apcmini2.js` :  
```
//config  

wing = 1;   //set wing 1 or 2  
page = 0;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)  
midi_in = 'APC MINI';     //set correct midi in device name  
midi_out = 'APC MINI';    //set correct midi out device name  
```
-----
for mk2 u can select 2 color modes, and led brightness

Find in `dot2apcminimk2.js` :  
```
//config

wing = 0;   //select wing 1 or 2, or code fader 0  
pageselect = 1;   //set page select mode - 0 - off, 1 - only exec buttons, 2 - exec buttons and faders together  
midi_in = 'APC mini mk2';     //set correct midi in device name  
midi_out = 'APC mini mk2';    //set correct midi out device name  
brightness = 4;     //led brightness 0-6  
darkmode = 0;   //new color mode 1 - ON , 0 - OFF  
colorpage = 5;  //select page to display colors palete (1- 5), 0 = off  
autocolor = 1;  //Get color from Executor name  
```
-----
### Macros

Copy this Macros to your dot2 Macro Folder.  
In Windows:  
`C:\ProgramData\MA Lighting Technologies\dot2\dot2_V_1.9\macros`

in dot2 Console enter Import-Command for each Macro.  
Example:  
`Import "macro_51_apcmini_palete_page5" At Macro 51`
