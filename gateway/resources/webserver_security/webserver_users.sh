#!/bin/ksh

#set -x 

java_dir=/opt/geneos/packages/webserver/GA3.3.0/JRE/bin
webserver_dir=/opt/geneos/webserver/webservers/
webserver_script_dir=/opt/geneos/gateway/resources/webserver_security
#webserver_name=UK_LDN_DEMO_PS_P02
webserver_name=`cat $webserver_script_dir/webserver_name.txt`
config_dir=config/
users_file=users.properties
log_file=$webserver_dir/$webserver_name/logs
count=1

echo Line,User,Role

cat $webserver_dir/$webserver_name/$config_dir/$users_file | grep -v ^# | while read line 
do
	user=`echo $line | awk -F"=" '{print $1}'`
	password=`echo $line | sed 's/\=/\,/' | awk -F"," '{print $2}'`
	role=`echo $line | sed "s#$user\=$password\,##" | sed 's/,/\\\,/' | sed 's/\r//'`
	echo "$count,$user,$role"
	count=`expr $count + 1`
done

Port=`cat $log_file/webserver.log | grep "Starting server on port" | tail -1 | awk -F']' '{print $2}'| sed 's/ Starting server on port //' | sed 's/\.\.\.//'`
Version=`cat $log_file/webserver.log | grep "geneos-web-server" | tail -1 | awk -F']' '{print $2}'| sed 's/                geneos-web-server//' | sed 's/ //'`
Status_count=`ps -ef | grep webserver | grep $webserver_name | wc -l`

if [ $Status_count -eq 0 ]
then
	Status="Not Running"
else	
	Status="Running"
fi

echo "<!>Version,$Version"
echo "<!>Port,$Port"
echo "<!>Status,$Status"
echo "<!>Webserver Name,$webserver_name"
