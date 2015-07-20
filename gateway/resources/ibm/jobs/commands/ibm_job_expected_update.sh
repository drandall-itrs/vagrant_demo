#!/bin/ksh
#set -x

#$1 - delete or add
#$2 - Job Name
#$3 - Job Start Time
#$4 - Job End Time

# Options adding are to insert line in line # or at end 

netprobe_dir=/opt/geneos/gateway
main_dir=resources/ibm/jobs
commands_dir=commands
file=jobs_expected.csv
logs=logs
logfile_name=ibm_expected_jobs.log


date=`date +%c`


# Below works in Linux and not Sunx86
# for i in {1..10}

case $1 in
	delete)
		job_name=$2
		echo "Entry removed on $date,`cat $netprobe_dir/$main_dir/$file | grep $job_name`" >> $netprobe_dir/$main_dir/$commands_dir/$logs/$logfile_name
		
		sed -i "/$job_name/d" $netprobe_dir/$main_dir/$file

		echo " "
		echo "Removed $job_name from EXPECTED JOB view"
		echo " "
		
		;;
	add_to_end)
		job_name=$2
                job_start_time=$3
                job_end_time=$4

           	echo "$job_name,$job_start_time,$job_end_time," >> $netprobe_dir/$main_dir/$file

		echo "Entry added on $date -> $job_name,$job_start_time,$job_end_time" >> $netprobe_dir/$main_dir/$commands_dir/$logs/$logfile_name
		;;	
	help)
		echo "Help information for ibm-i jobs"
		echo " "
		echo "Format is;"
		echo " "
		echo "Job Name :"
		echo "Start Time : e.g. 09:00"
		echo "End Time : e.g. 15:00 "
		echo " "
		echo "N.B. Time is in 24-hour format with colon delimeter between HH:MM"
		;;
	*)	
		echo "Invalid choice"
		;;
esac

exit 0

