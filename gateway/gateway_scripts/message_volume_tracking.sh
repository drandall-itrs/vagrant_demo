#!/bin/ksh

log_format=`date +%b_%Y`
#year=`date +%Y`
#date=`date +%c`

if [[ -z "$_ROWNAME" ]] 
then
	_ROWNAME="N/A as headline"
fi

echo "$_ALERT_CREATED, $_SEVERITY, $_MANAGED_ENTITY,$_PLUGINNAME, $_ROWNAME, $_VARIABLE, $_VALUE " >> /tmp/volumes_$log_format.log
