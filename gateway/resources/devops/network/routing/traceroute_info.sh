#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/network/routing
traceroute_destination=`cat $dir/traceroute_destination`

traceroute_info=`traceroute $traceroute_destination > $dir/$$.out`

echo "Hop Count,Device, Device IP,Packet 1, Packet 2, Packet 3"

sed -n '2,$ p' $dir/$$.out | while read line
do
	echo $line | sed 's/ ms/ms /g' | sed 's/ (/ /' | sed 's/) / /' | sed 's/\s\+/,/g'
done

traceroute_details=`cat $dir/$$.out | head -1 | sed 's/,/ /g'`
echo "<!>Traceroute_details,$traceroute_details"
echo "<!>Traceroute_destination,$traceroute_destination"

rm $dir/$$.out
