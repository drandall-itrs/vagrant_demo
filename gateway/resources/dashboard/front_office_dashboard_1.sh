#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/dashboard/
file=source.txt


cat $dir/$file | head -1 | awk -F"," '{ print $0 }'

cat $dir/$file | sed -n '2,$ p' | awk -F"," '{ print $0 }' | while read line 
do
	actual_line=`echo $line | awk -F"," '{ print $0 }'`
	category=`echo $line | awk -F"," '{ print $1 }'`	
	items=`echo $line | awk -F"," '{ print $2 }'`

	total_count=0
	total_warning=0
	category_total_warning=0
	total_critical=0
	category_total_critical=0

	while [ $total_count -lt $items ]
	do
		#rt=$total_warning
		#rtc=$total_critical
		
		#total_warning=$(( $RANDOM % 1 ))
		total_warning_random=$RANDOM
		total_critical_random=$RANDOM
		total_warning=$(( total_warning_random %= 5 ))
		total_critical=$(( total_critical_random %= 3 ))
		#total_critical=$(( $RANDOM % 10 ))

		#if (( $total_warning >= 3 ))
		#then
		#	total_warning=0
		#fi

		if (( $total_warning % 2 == 0 ))
		then
			total_warning=0
			#echo "${category}_$total_count,${category},$total_warning,$total_critical"
		fi

		if (( $total_critical % 2 == 0 ))
		then
			total_critical=0
			#echo "${category}_$total_count,${category},$total_warning,$total_critical"
		fi

		total_count=$((total_count+1))	
		echo "${category}_$total_count,${category},$total_warning,$total_critical"
		category_total_warning=`expr "$category_total_warning" + "$total_warning"`
		category_total_critical=`expr "$category_total_critical" + "$total_critical"`


	done
	
	echo ""${category}"_total,${category},$category_total_warning,$category_total_critical"

	
done

