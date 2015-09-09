#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/inodes

node_info=`df -iP > $$.out`

#node_info_header="`cat $$.out | head -n 1 | sed 's/(.*//'`"

cat $$.out | head -n 1 | sed -e 's/\s\+/,/g' -e 's/Mounted,on/Mounted on/'

sed -n '2,$ p' $$.out | while read line
do
        echo $line | sed 's/://' | sed 's/\s\+/,/g'
done

rm $$.out
