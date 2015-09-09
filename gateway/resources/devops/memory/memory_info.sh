#!/bin/ksh

#set -x

hostname=`hostname`
top -b -n 1 > $$.out
mem_info_line=`cat $$.out | grep ^Mem | sed -e 's/Mem://' -e 's/total//' -e 's/used//' -e 's/free//' -e 's/buffers//'`
swap_info_line=`cat $$.out | grep ^Swap | sed -e 's/Swap://' -e 's/total//' -e 's/used//' -e 's/free//' -e 's/cached//'`

echo "hostname name,hostname, total, used, free, buffered"
echo "${hostname}_memory,$hostname,$mem_info_line"
echo "${hostname}_swap,$hostname,$swap_info_line"
rm $$.out
