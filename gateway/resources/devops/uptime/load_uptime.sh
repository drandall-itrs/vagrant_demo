#!/bin/ksh

hostname=`hostname`
uptime=`uptime| sed 's/load average://'`

echo "hostname name,hostname,uptime_since,users, load_1 minute, load_5 minutes, load_15 minutes"
echo "$hostname,$hostname,$uptime"
