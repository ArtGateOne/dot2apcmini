# dot2apcmini2
nodejs code to control dot2 software use Akai APC mini midi controller


Download and instal NODEJS version 14.17 from https://nodejs.org/en/

Download my code.

----------------------

How to use

run dot2 software

turn on webremote (password remote)

run from cmd line

node dot2apcmini2.js

--------------------

Edit file to config

//config 

wing = 1;   //set wing 1 or 2

page = 0;   //set page select mode - 0-off, 1-only exec buttons(5), 2-exec buttons and faders together(5)

midi_in = 'APC MINI 0';     //set correct midi in device name

midi_out = 'APC MINI 1';    //set correct midi out device name

