#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/top_cpu_procs

top_x=`cat $dir/top_x.out`
top_x_output=`expr $(( top_x - 1 ))`
top_cpu_info=`ps aux | sort -rk 3,3 | head -n $top_x > $$.out`
count=1
actual_info=`cat $$.out | head -1 | sed 's/\s\+/,/g'`


echo "Process_ranking,$actual_info"

sed -n '2,$ p' $$.out | while read line 
do
	user=`echo $line | awk -F" " '{ print $1 }' | sed 's/\s\+/,/'`
	pid=`echo $line | awk -F" " '{ print $2 }' | sed 's/\s\+/,/'`
	cpu=`echo $line | awk -F" " '{ print $3 }' | sed 's/\s\+/,/'`
	mem=`echo $line | awk -F" " '{ print $4 }' | sed 's/\s\+/,/'`
	vsz=`echo $line | awk -F" " '{ print $5 }' | sed 's/\s\+/,/'`
	rss=`echo $line | awk -F" " '{ print $6 }' | sed 's/\s\+/,/'`
	tty=`echo $line | awk -F" " '{ print $7 }' | sed 's/\s\+/,/'`
	stat=`echo $line | awk -F" " '{ print $8 }' | sed 's/\s\+/,/'`
	start=`echo $line | awk -F" " '{ print $9 }' | sed 's/\s\+/,/'`
	time=`echo $line | awk -F" " '{ print $10 }' | sed 's/\s\+/,/'` 
	command=`echo $line | awk -F" " '{$1=$2=$3=$4=$5=$6=$7=$8=$9=$10=""; print $0}'`
	#echo "Top $count CPU process,$line"
	echo "Top $count CPU process,$user,$pid,$cpu,$mem,$vsz,$rss,$tty,$stat,$start,$time,$command"
	count=$(( count + 1 ))
done

echo "<!>Top number of processes,$top_x_output"
rm $$.out
