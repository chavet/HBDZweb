@echo off
set SCRIPTPATH=%~dp0
casperjs %SCRIPTPATH%app\casper\SWY_debug.js
exit