# dot2apcmini
nodejs code to control dot2 software use Akai APCmini midi controller, and akai apc mini mk2


Download and instal NODEJS version 14.17 from https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi


Download my code.

----------------------

How to use

run dot2 software

turn on webremote (password remote)

set node.exe as default tool to open .js files

double click on icon dot2apcmini.js to start

if u have akai apc mini mk2

double click on icon dot2apcminimk2.js


--------------------

Edit file to config

//config 

wing = 1;   //set wing 1 or 2

page = 1;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI';     //set correct midi in device name

midi_out = 'APC MINI';    //set correct midi out device name


-----

for mk2 u can select 2 color modes, and led brightness


//config 


wing = 0;   //select wing 1 or 2, or code fader 0

pageselect = 1;   //set page select mode - 0 - off, 1 - only exec buttons, 2 - exec buttons and faders together

midi_in = 'APC mini mk2';     //set correct midi in device name

midi_out = 'APC mini mk2';    //set correct midi out device name

brightness = 6;     //led brightness 0-6

darkmode = 0;   //new color mode 1 - ON , 0 - OFF

colorpage = 5;  //select page to display colors palete (1- 5), 0 = off

autocolor = 1;  //Get color from Executor name (use MA Colors names like Red, Green, Orange, Fern Green ...


-------


Tips

If u have set - pageselect = 1;

Turn Off Autofix to off in Global Settings

-------

If u have Active GLobal Autofix

U can set page select to mode 2

pageselect = 2;

--------

U can off Autofix for only Executors

use command

Assign Executor 301  Thru 816 / AutoFix = "Off"

or 

Assign Executor 101  Thru 816 / AutoFix = "Off"


