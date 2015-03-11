#!/bin/ksh
#set -x

#$1 - delete or add
#$2 - line number to delete or add
#$3 - text to add (directory for deleting)
#$4 - directory (for adding)

# Options adding are to insert line in line # or at end 

netprobe_dir=/opt/geneos/gateway/
main_dir=resources/messagebox


# Below works in Linux and not Sunx86
# for i in {1..10}

case $1 in
	delete)
		echo "Will delete"
		directory=$3
		rm $netprobe_dir/$main_dir/$directory/line$2

		for i in 1 2 3 4 5
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
		directory=$4
		echo "$3" > $netprobe_dir/$main_dir/$directory/line$2

		;;

	add_to_end)
		directory=$4
		for i in 1 2 3 4 5
		do
			line_contents=`cat $netprobe_dir/$main_dir/$directory/line$i | wc -l` 
			echo "Line ->$line_contents"

		if [[ $i = 5 ]]
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
			;;	
	*)	
		echo "Invalid choice"
		;;
esac

exit 0

