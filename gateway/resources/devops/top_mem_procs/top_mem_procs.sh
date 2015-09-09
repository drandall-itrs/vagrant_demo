#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/top_mem_procs

top_x=`cat $dir/top_x.out`
#top_x_output=`expr $(( top_x - 1 ))`
top_x_output=$top_x
top_mem_info=`ps axo %mem,pid,euser,cmd | sort -nr | head -n $top_x > $$.out`
count=1

actual_info="Memory,pid,user,command"

echo "Process_ranking,$actual_info"

sed -n '1,$ p' $$.out | while read line 
do
	user=`echo $line | awk -F" " '{ print $3 }' | sed 's/\s\+/,/'`
	pid=`echo $line | awk -F" " '{ print $2 }' | sed 's/\s\+/,/'`
	mem=`echo $line | awk -F" " '{ print $1 }' | sed 's/\s\+/,/'`
	command=`echo $line | awk -F" " '{$1=$2=$3=""; print $0}'`
	#echo "Top $count CPU process,$line"
	echo "Top $count MEM process,$mem,$pid,$user,$command"
	count=$(( count + 1 ))
done

echo "<!>Top number of processes,$top_x_output"
rm $$.out
