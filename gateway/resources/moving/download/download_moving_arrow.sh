#!/bin/ksh

#set -x

netprobe_dir=/opt/geneos/gateway/resources
main_dir=moving/download
file=$netprobe_dir/$main_dir/source.txt
file_wip=$netprobe_dir/$main_dir/source_wip.txt
line=0
total_lines=`cat $file | wc -l`
#live_line=`grep \,0 $file | awk -F"," '{print $1}'| sed s/line_//`
live_line_found=`grep \,1 $file | wc -l`

if [ "$live_line_found" = "$total_lines" ]
then
	live_line=0
	line_to_use=0
else
	live_line=`expr "$live_line_found" + 1`
	line_to_use=`expr "$live_line_found" + 1`
fi

IFS=","

#if [ "$live_line" -eq 0 ]
#then
#	line_to_use=1
#fi

echo "line_number,value" 

cat $file | while read line value
do
	if [ "`echo $line | sed s/line_//`" -le "$line_to_use" ]
	then
		echo "$line,1" >> $file_wip	
	else
		echo "$line,0" >> $file_wip
	fi
done

mv $file_wip $file
cat $file
