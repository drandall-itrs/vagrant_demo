#!/bin/ksh

#set -x

netprobe_dir=/opt/geneos/gateway/resources
main_dir=moving
file=$netprobe_dir/$main_dir/source.txt.orig2
file_wip=$netprobe_dir/$main_dir/source_wip.txt2
file_static=$netprobe_dir/$main_dir/source.txt_static
line6=0
line4=0
line3=0
total_lines=`cat $file | wc -l`
live_line_4=`grep -P line_[1-6],1,[0-1],[0-1] $file | awk -F"," '{print $1}'| sed s/line_//`
live_line_6=`grep -P line_[1-6],[0-1],1,[0-1] $file | awk -F"," '{print $1}'| sed s/line_//`
live_line_3=`grep -P line_[1-6],[0-1],[0-1],1 $file | awk -F"," '{print $1}'| sed s/line_//`
total_line_6=6
total_line_4=4
total_line_3=3

IFS=","

if [ ! -f $file ]
then
	cp $file_static $file
fi

if [ `expr "$live_line_4" + 1` -gt $total_line_4 ]
then
	line_to_use_4=1
else
	line_to_use_4=`expr "$live_line_4" + 1`
fi

if [ `expr "$live_line_6" + 1` -gt $total_line_6 ]
then
        line_to_use_6=1
else
        line_to_use_6=`expr "$live_line_6" + 1`
fi

if [ `expr "$live_line_3" + 1` -gt $total_line_3 ]
then
        line_to_use_3=1
else
        line_to_use_3=`expr "$live_line_3" + 1`
fi


echo "line_number,value,value6,value3" 
#cp $file $file_wip

cat $file | while read line value
do
	if [ "$line" = "line_$line_to_use_4" ]
	then
		line_out=$line,1
	else
		line_out=$line,0
	fi

	if [ "$line" = "line_$line_to_use_6" ]
        then
                line_out=$line_out,1
        else
                line_out=$line_out,0
        fi

	if [ "$line" = "line_$line_to_use_3" ]
        then
                line_out=$line_out,1
        else
                line_out=$line_out,0
        fi

#	echo "$line_out" 
	echo "$line_out" >> $file_wip
		
done

mv $file_wip $file
cat $file
