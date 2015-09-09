#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/network/routing

route_info=`/sbin/route -n > $$.out`

sed -n '2,$ p' $$.out | while read line
do
	echo $line | sed 's/\s\+/,/g'
done

rm $$.out
