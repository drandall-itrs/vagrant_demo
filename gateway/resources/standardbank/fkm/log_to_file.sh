#!/bin/ksh
set +x

log_format=`date +%b_%Y`
#year=`date +%Y`
date=`date +%c`
logfile_name=/opt/geneos/gateway/resources/standardbank/fkm/alertlog/log_to_file_$log_format.log

if [[ -z "$_ROWNAME" ]] 
then
	_ROWNAME="N/A as headline"
fi

if [[ ! -f "$logfile_name" ]]
then
	echo "Date, Region, City, From, Original Date, Severity, Latency(ms), Message" >> $logfile_name
fi

echo "$date, $REGION,$CITY,$_from, $_original_date,$_severity,$_latency, $_triggerDetails" >> $logfile_name
#env >> $logfile_name
#echo "----oOo----" >> $logfile_name
