#!/bin/ksh
#set +x

log_format=`date +%b_%Y`
date=`date +%c`
logfile_name=/opt/geneos/gateway/resources/standardbank/fkm/countlog/count_log_to_file_$log_format.log

if [[ -z "$_ROWNAME" ]] 
then
	_ROWNAME="N/A as headline"
fi

if [[ ! -f "$logfile_name" ]]
then
	echo "Date, Count" >> $logfile_name
fi

echo "$date, $_count" >> $logfile_name
