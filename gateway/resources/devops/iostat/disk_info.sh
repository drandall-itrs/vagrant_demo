#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/iostats

iostat_info=`iostat > $$.out`

server_info="`cat $$.out | head -n 1 | sed 's/(.*//'`"
avg_info_user=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $2 }' | sed 's/\s\+//'`
avg_info_nice=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $3 }' | sed 's/\s\+//'`
avg_info_system=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $4 }' | sed 's/\s\+//'`
avg_info_iowait=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $5 }' | sed 's/\s\+//'`
avg_info_steal=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $6 }' | sed 's/\s\+//'`
avg_info_idle=`cat $$.out | grep ^avg-cpu | sed 's/avg-cpu://' | awk -F"%" '{ print $7 }' | sed 's/\s\+//'`

avg_info_user_info=`sed '4q;d' $$.out |  awk  '{ print $1 }'`
avg_info_user_nice=`sed '4q;d' $$.out |  awk  '{ print $2 }'`
avg_info_user_system=`sed '4q;d' $$.out |  awk  '{ print $3 }'`
avg_info_user_iowait=`sed '4q;d' $$.out |  awk  '{ print $4 }'`
avg_info_user_steal=`sed '4q;d' $$.out |  awk  '{ print $5 }'`
avg_info_user_idle=`sed '4q;d' $$.out |  awk  '{ print $6 }'`

#echo "`sed '6q;d' $$.out |  sed 's/://' | sed 's/\s\+/,/g'`"

sed -n '6,$ p' $$.out | while read line
do
	echo $line | sed 's/://' | sed 's/\s\+/,/g'
done	



echo "<!>Server info,$server_info"
echo "<!>avg_info_user,$avg_info_user_info"
echo "<!>avg_info_nice,$avg_info_user_nice"
echo "<!>avg_info_system,$avg_info_user_system"
echo "<!>avg_info_iowait,$avg_info_user_iowait"
echo "<!>avg_info_steal,$avg_info_user_steal"
echo "<!>avg_info_idle,$avg_info_user_idle"
rm $$.out

