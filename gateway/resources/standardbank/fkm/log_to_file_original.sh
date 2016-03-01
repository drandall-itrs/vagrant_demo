#!/bin/ksh

log_format=`date +%b_%Y`
#year=`date +%Y`
#date=`date +%c`
logfile_name=/opt/geneos/gateway/resources/standardbank/fkm/alertlog/log_to_file_$log_format.log

if [[ -z "$_ROWNAME" ]] 
then
	_ROWNAME="N/A as headline"
fi

echo "$_ALERT_CREATED, $_SEVERITY, $_MANAGED_ENTITY,$_PLUGINNAME, $_ROWNAME, $_VARIABLE, $_VALUE, $_PRODUCT " >> $logfile_name
env >> $logfile_name
echo "------oOo------" >> $logfile_name
echo " " >> $logfile_name
