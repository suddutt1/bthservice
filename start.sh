#!/bin/bash
tsc
export PORT=4000
echo "Killing on the old process if any"
kill -9 `cat pid.txt`
echo "Starting the server"
nohup node  dist/index.js  >service.log 2>&1 &
echo $! > pid.txt
echo "Waiting for process to launch"
sleep 2
echo `cat service.log`
