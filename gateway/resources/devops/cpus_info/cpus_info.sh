#!/bin/ksh

#set -x

hostname=`hostname`
top -b -n 1 > $$.out
cpus_info_line=`cat $$.out | grep ^Cpu`

echo "hostname name,hostname,user CPU time,system CPU time, nice CPU time,CPU idle time,IO wait,hardware interrupts,software interrupts,steal time"
echo "$hostname,$hostname,$cpus_info_line"
rm $$.out
