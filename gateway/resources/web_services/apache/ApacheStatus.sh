#!/bin/bash

echo "Parameter,Value"
IP=$1
wget http://$1/server-status?auto -q -O - |sed 's/: /,/' |grep -v Scoreboard
#wget http://www.apache.org/server-status?auto -q -O - |sed 's/: /,/' |grep -v Scoreboard
