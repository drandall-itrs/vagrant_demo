#!/bin/ksh
#set -x

#$1 - delete or add
#$2 - line number to delete or add
#$3 - text to add (directory for deleting)
#$4 - directory (for adding)

# Options adding are to insert line in line # or at end 

netprobe_dir=/opt/geneos/gateway
main_dir=resources/messagebox
logs=logs
logfile_name=messagebox.log

date=`date +%c`


# Below works in Linux and not Sunx86
# for i in {1..10}

case $1 in
	delete)
		echo "Will delete"
		directory=$3
		echo "Entry removed on $date,`cat $netprobe_dir/$main_dir/$directory/line$2`" >> $netprobe_dir/$main_dir/$logs/$logfile_name 
		rm $netprobe_dir/$main_dir/$directory/line$2
		

		#for i in 1 2 3 4 5 6 7 8 9 10
		END=`ls -l $netprobe_dir/$main_dir/$directory/ | grep -v total | wc -l`
                for i in $(seq 1 $END )
		do
        	if [ ! -f $netprobe_dir/$main_dir/$directory/line$i ]
        	then
#               	echo "line$i file missing!"
                	if [[ $i < 5 ]]
                	then
                        	blank_line_number=$(( i + 1 ))
                        	mv $netprobe_dir/$main_dir/$directory/line$blank_line_number $netprobe_dir/$main_dir/$directory/line$i
#                       	echo "Moving line$blank_line_number to line$i"

                	else
                        	echo "At line $i so no more needed"
                        	touch $netprobe_dir/$main_dir/$directory/line$i
                	fi
#       	else
#               	echo "Line$i exists"
        	fi
        	line_info=`cat $netprobe_dir/$main_dir/$directory/line$i`
        	echo "line$i,$i,$line_info"
		done

		;;
	add_to_line)

		echo "Will add"
		if [ `echo $2 | grep ,` ]
		then
			text=`echo $2 | sed "s/,/ /g"`
		else
			text=$2
		fi
		#text=$2
		directory=$3
		#date=`date +%c`
		eta=$4
		status=$5
		END=`ls -l $netprobe_dir/$main_dir/$directory/ | grep -v total | wc -l`
		TOTAL_LINES=$END

		#for i in $(seq $END 1)
		while [ $END -ge 1 ]
		do
			if [[ $TOTAL_LINES = $END ]]
			then
				cp /dev/null $netprobe_dir/$main_dir/$directory/line$END
			else	
				END_PLUS=$(( END+1 ))
				cat $netprobe_dir/$main_dir/$directory/line$END > $netprobe_dir/$main_dir/$directory/line$END_PLUS
			fi
			
			(( END-- ))

		done
			
		echo "$date,$text,$eta,$status" > $netprobe_dir/$main_dir/$directory/line1
		echo "Entry added on $date,`cat $netprobe_dir/$main_dir/$directory/line1`" >> $netprobe_dir/$main_dir/$logs/$logfile_name

		;;

	add_to_end)
		directory=$4
		#for i in 1 2 3 4 5
		END=`ls -l $netprobe_dir/$main_dir/$directory/ | grep -v total | wc -l`
		for i in $(seq 1 $END )
		do
			line_contents=`cat $netprobe_dir/$main_dir/$directory/line$i | wc -l` 
			echo "Line ->$line_contents"

		if [[ $i = $END ]]
		then
			echo "$3" > $netprobe_dir/$main_dir/$directory/line$i
		else
			if [[ `cat $netprobe_dir/$main_dir/$directory/line$i | wc -l` -eq 0 ]]
			then
                	        echo "$3" > $netprobe_dir/$main_dir/$directory/line$i
				exit 0
			else
				echo "Nothing done in line$i"
			fi
		fi
		done

		echo "Entry added on $date,$2" >> $netprobe_dir/$main_dir/$logs/$logfile_name
			;;	
	modify_status)
		#line=$2
		directory=$3
		to_status=$4
		from_status=`cat $netprobe_dir/$main_dir/$directory/line$2 | awk -F, '{ print $NF }'` 
		#set_status=`cat $netprobe_dir/$main_dir/$directory/line$2 | sed -i "s/\,$from_status/\,$to_status/g"`
		set_status=`sed -i "s/\,$from_status/\,$to_status/g" $netprobe_dir/$main_dir/$directory/line$2`

		echo "Entry modified from $from_status to $to_status on $date,`cat $netprobe_dir/$main_dir/$directory/line$2`" >> $netprobe_dir/$main_dir/$logs/$logfile_name

		;;
	*)	
		echo "Invalid choice"
		;;
esac

exit 0

