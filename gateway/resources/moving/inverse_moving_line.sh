#!/bin/ksh

#set -x

netprobe_dir=/opt/geneos/gateway/resources
main_dir=moving
file=$netprobe_dir/$main_dir/isource.txt
file_wip=$netprobe_dir/$main_dir/isource_wip.txt
line=0
total_lines=`cat $file | wc -l`
live_line=`grep \,0 $file | awk -F"," '{print $1}'| sed s/line_//`
IFS=","


if [ `expr "$live_line" + 1` -gt $total_lines ]
then
	line_to_use=1
else
	line_to_use=`expr "$live_line" + 1`
fi

echo "line_number,value" 

cat $file | while read line value
do
	if [ "$line" = "line_$line_to_use" ]
	then
		echo "$line,0" >> $file_wip	
	else
		echo "$line,1" >> $file_wip
	fi
done

mv $file_wip $file
cat $file
