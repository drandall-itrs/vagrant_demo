#!/bin/ksh

log_format=`date +%b_%Y`
#year=`date +%Y`
#date=`date +%c`

if [[ -z "$_ROWNAME" ]] 
then
	_ROWNAME="N/A as headline"
fi

echo "$_ALERT_CREATED, $_SEVERITY, $_MANAGED_ENTITY,$_PLUGINNAME, $_ROWNAME, $_VARIABLE, $_VALUE, $_PRODUCT " >> /tmp/node_down_$log_format.log
env >> /tmp/node_down_$log_format.log
echo "------oOo------" >> /tmp/node_down_$log_format.log
echo " " >> /tmp/node_down_$log_format.log
