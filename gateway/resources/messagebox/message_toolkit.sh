#!/bin/ksh

#set -x 

main_dir=resources/messagebox/localhost_7034
gateway_dir=/opt/geneos/gateway/

echo Line,line_number,date,text,eta,status

#for i in 1 2 3 4 5
END=`ls -l $gateway_dir/$main_dir/ | grep -v total | wc -l`

for i in $(seq 1 $END)
do
	text=`cat $gateway_dir/$main_dir/line$i`
	echo "line$i,$i,$text"
done

echo "<!>Directory, localhost_7034"

exit 0

