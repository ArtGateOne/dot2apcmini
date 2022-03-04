# dot2apcmini2
nodejs code to control dot2 software use Akai APCmini midi controller


Download and instal NODEJS version 14.17 from https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi

or https://nodejs.org/dist/v16.14.0/node-v16.14.0-x64.msi for 16.14 version




Download my code.

----------------------

How to use

run dot2 software

turn on webremote (password remote)

run from command prompt (win+R - cmd)

node dot2apcmini2.js

--------------------

Edit file to config

//config 

wing = 1;   //set wing 1 or 2

page = 0;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI 0';     //set correct midi in device name

midi_out = 'APC MINI 1';    //set correct midi out device name


-----
nodejs 16.14
midi_in = 'APC MINI';     //set correct midi in device name

midi_out = 'APC MINI';    //set correct midi out device name


