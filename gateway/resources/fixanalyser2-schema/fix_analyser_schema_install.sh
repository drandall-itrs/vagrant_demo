#!/bin/bash

# Copyright (c) 2013 ITRS Group Ltd
# All rights reserved

# This script automates the creation and configuration of a fix-analyser order database

MIN_MYSQL_VERSION_MAJOR=5	
MIN_MYSQL_VERSION_MINOR=1
MIN_MYSQL_VERSION_PATCH=6

banner(){
	cat <<BANNER

####################################################################
##                                                                ##
##      Installation script for fix-analyser database schema      ##
##                                                                ##
##      This script automates the creation and configuration      ##
##      of a fix-analyser message database                        ##
##                                                                ##
##      Copyright (c) 2013 ITRS Group Ltd                         ##
##      All rights reserved                                       ##
##                                                                ##
####################################################################

BANNER
}

usage(){
	cat <<USAGE
Pre-requisites: 

Mysql server version '$MIN_MYSQL_VERSION_MAJOR.$MIN_MYSQL_VERSION_MINOR.$MIN_MYSQL_VERSION_PATCH' or later is required for this 
installation.

Usage:

This script can be used to either install and configure a
fresh database instance or upgrade an existing fix-analyser 
database to the latest schema. 

New-Install mode:
Type: $0 -n

Running in this mode will prompt for the following information
about your mysql server:
	
	Mysql dba username
	Mysql dba password
	Mysql hostname
	Mysql port
	Fixanalyser username to create
	FixAnalyser password to create
	Database name to create

Upgrade mode:
Type: $0 -u
	
Running in this mode will prompt for the following information
about your mysql server:
	
	Mysql dba username
	Mysql dba password
	Mysql hostname
	Mysql port
	Database name to upgrade
USAGE

error_exit
}

MYSQL_BINARY="mysql"
COMMAND_FILE=/tmp/fix_analyser_mysql_install.in
COMMAND_OUTPUT_FILE=/tmp/fix_analyser_mysql_install.out
SCHEMA_1_2="mysql-fix-analyser-v1.2-db-schema.sql"
SCHEMA_TMP=/tmp/schema_file.sql
SCHEMA_UPGRADE_1_0="mysql-fix-analyser-v1.0-v1.1-schema-upgrade.sql"
SCHEMA_UPGRADE_1_1="mysql-fix-analyser-v1.1-v1.2-schema-upgrade.sql"

# Function sets up resources required by the script
setup(){
	touch $COMMAND_FILE
	touch $COMMAND_OUTPUT_FILE
	touch $SCHEMA_TMP
}

# Function clears up resources used by the script
teardown(){
	rm $COMMAND_FILE
	rm $COMMAND_OUTPUT_FILE
	rm $SCHEMA_TMP
}

#
# This function gets a value for the symbol named in its first argument
# If the symbol has no value, or the $prompt symbol is set, it will prompt
# the user for a value. It will use the second argument to supply a default value.
# The third argument is used as the prompt.
#
#prompt=yes
promptFor () {
	sym='$'$1
	val=$(eval echo $sym)
	if [[ $prompt || -z "${val}" ]]; then
		echo -n "Enter $3 [default '$2']: "
		read $4 val
	else
		echo "Using $3 from $sym environment"
	fi
	val="'${val:-$2}'"
	eval $1=$val
	#echo $1 = $val
}

locate_resources_up(){
	locate_mysql
	echo "Checking resource files:"
	locate_file $SCHEMA_UPGRADE_1_0
	locate_file $SCHEMA_UPGRADE_1_1
}

locate_resources_new(){
	locate_mysql
	echo "Checking resource files:"
	locate_file $SCHEMA_1_2
}

locate_file(){
	if ! [[ -r $1 && -f $1 ]]; then
		error_exit "Fatal: Failed to locate resource file $1"
	fi
}

#Function seraches for and validates the mysql binary
locate_mysql(){
	echo ""
	echo "Searching for mysql client binary..."
	MYSQL_BINARY=`which $MYSQL_BINARY`
	if [ $? -ne 0 ]; then
		echo "Could not locate mysql client on path please supply full path to mysql binary"
		read BINARY_PATH 
		MYSQL_BINARY="$BINARY_PATH/mysql"
		which $MYSQL_BINARY > /dev/null 2>&1
		if [ $? -ne 0 ]; then	
			error_exit "Fatal: Failed to find mysql binary at $MYSQL_BINARY"
		fi
	fi
	#if we get here should have located a binary so lets test it
	$MYSQL_BINARY --help > /dev/null 2>&1
	if [ $? -ne 0 ]; then
		error_exit "Fatal: Failed to execute $MYSQL_BINARY"
	else
		echo "Success: Located mysql binary at $MYSQL_BINARY"
	fi
}

check_no_db(){
	echo use $1 > $COMMAND_FILE
	$MYSQL_BINARY -h$MYSQL_HOST -p$MYSQL_PORT -u$ROOT_USER -p$ROOT_PASS < $COMMAND_FILE > /dev/null 2>&1
	return $?
}

run_sql_query(){
	echo $1 > $COMMAND_FILE
	run_sql_file $COMMAND_FILE
}

run_sql_file(){
	$MYSQL_BINARY --batch --skip-column-names -h$MYSQL_HOST -p$MYSQL_PORT -u$ROOT_USER -p$ROOT_PASS < $1 > $COMMAND_OUTPUT_FILE
	ret=$?
	if [ $ret -ne 0 ]; then
		error_exit "Fatal: Failed to execute query $1"
	fi
}

enable_event_scheduler(){
	echo ""
	echo "Enabling Event Scheduler..."
	run_sql_query "SET GLOBAL event_scheduler = ON;" 
	run_sql_query "SHOW PROCESSLIST" 
	results=`grep -c event_scheduler $COMMAND_OUTPUT_FILE`
	if [ $results -ne 1 ]; then
		error_exit "Fatal: Failed to enable Global scheduler"
	fi
	echo "Success: Event scheduler process enabled"
	echo
}

create_user(){

	promptFor FIX_USER fix_user "fix-analyser database username"
	run_sql_query "SELECT COUNT(*) FROM mysql.user WHERE Host='%' AND User='$FIX_USER'"
	ret=`cat $COMMAND_OUTPUT_FILE`
	if [ $ret -eq 0 ]; then
		echo "User $FIX_USER does not exist and will be created"
		promptFor FIX_PASS fix_pass "password for user $FIX_USER" "-s"
		echo .
		run_sql_query "CREATE USER $FIX_USER@'%' IDENTIFIED BY '$FIX_PASS'"
	else
		promptFor USE_EXISTING_ACCOUNT n "User $FIX_USER already exists, do you wish to use this user for logging? (y|n)"
		if [ $USE_EXISTING_ACCOUNT = "n" ]; then
			create_user
			return
		fi
	fi
	echo "Permissioning user $FIX_USER for database $DB_NAME"
	run_sql_query "GRANT event, execute, select, insert, update, delete ON $DB_NAME.* TO $FIX_USER@'%';"
}

load_schema(){
	echo "Executing schema from $1"
	echo "use $DB_NAME" > $SCHEMA_TMP
	cat $1 >> $SCHEMA_TMP
	if [ $? -ne 0 ]; then
		error_exit "Fatal: could not find schema file $1"
	fi 
	run_sql_file $SCHEMA_TMP
}

schedule_housekeeping(){
	HOUSEKEEPING_EVENT="${DB_NAME}_housekeeping"
	echo "Scheduling housekeeping process $HOUSEKEEPING_EVENT"
	promptFor HK_TIME "00:15" "time to run housekeeping process (HH:MM)"
	promptFor HK_DAYS 3 "number of days data to keep"
	echo "use $DB_NAME;" > $SCHEMA_TMP
	echo "CREATE EVENT $HOUSEKEEPING_EVENT" >> $SCHEMA_TMP
	echo "ON SCHEDULE" >> $SCHEMA_TMP
	echo "	EVERY 1 DAY" >> $SCHEMA_TMP
	echo "	STARTS DATE_ADD(CURRENT_DATE(), INTERVAL '$HK_TIME' HOUR_MINUTE)" >> $SCHEMA_TMP
	echo "DO" >> $SCHEMA_TMP
	echo "	CALL $DB_NAME.removeExpiredFiles($HK_DAYS);" >> $SCHEMA_TMP
	run_sql_file $SCHEMA_TMP
}

do_new_install(){

	echo "Installing new database..."
	locate_resources_new
	get_db_credentials
	enable_event_scheduler
	promptFor DB_NAME FIX_DB "the name of the mysql database to create"
	check_no_db $DB_NAME
	if [ $? -eq 0 ]; then
		error_exit "Fatal: database '$DB_NAME' already exists, you need to delete the Database before you start for new installations"
	fi
	run_sql_query "CREATE DATABASE $DB_NAME;"
	create_user
	load_schema $SCHEMA_1_2
	schedule_housekeeping
	success_exit "Success: new database $DB_NAME installed"
}

upgrade1_0(){

	load_schema $SCHEMA_UPGRADE_1_0
	upgrade1_1
}

upgrade1_1(){
	load_schema $SCHEMA_UPGRADE_1_1
	schedule_housekeeping
	success_exit "Success: schema upgraded to version 1.2"
}

get_db_credentials(){
	echo
	promptFor ROOT_USER root "mysql dba user"
	promptFor ROOT_PASS "" "mysql dba password" "-s"
	echo
	promptFor MYSQL_HOST localhost "mysql hostname"
	promptFor MYSQL_PORT 3306 "mysql port"
	#check_mysql_version
}

check_mysql_version(){
	MYSQL_VERSION_ERROR_MESSAGE="Fatal: Mysql minimum version '$MIN_MYSQL_VERSION_MAJOR.$MIN_MYSQL_VERSION_MINOR.$MIN_MYSQL_VERSION_PATCH' is required"

	echo 
	echo "Verifying mysql version..."
	run_sql_query "SELECT VERSION();"
	MYSQL_VERSION=`cat $COMMAND_OUTPUT_FILE`
	MYSQL_VERSION_MAJOR=`echo $MYSQL_VERSION | awk 'BEGIN {FS="."} {print $1}'`
	MYSQL_VERSION_MINOR=`echo $MYSQL_VERSION | awk 'BEGIN {FS="."} {print $2}'`
	MYSQL_VERSION_PATCH=`echo $MYSQL_VERSION | awk 'BEGIN {FS="."} {print $3}' | awk 'BEGIN {FS="-"} {print $1}'`
	
	echo "Detected version '$MYSQL_VERSION_MAJOR.$MYSQL_VERSION_MINOR.$MYSQL_VERSION_PATCH'"
	if   [ $MYSQL_VERSION_MAJOR -lt $MIN_MYSQL_VERSION_MAJOR ]; then
		error_exit "$MYSQL_VERSION_ERROR_MESSAGE"
	elif [ $MYSQL_VERSION_MINOR -lt $MIN_MYSQL_VERSION_MINOR ]; then
		error_exit "$MYSQL_VERSION_ERROR_MESSAGE"
	elif [ $MYSQL_VERSION_PATCH -lt $MIN_MYSQL_VERSION_PATCH ]; then
		error_exit "$MYSQL_VERSION_ERROR_MESSAGE"
	fi

	echo "Success: Valid version of mysql detected"
}

do_upgrade(){
	echo "Upgrading database..."
	locate_resources_up
	get_db_credentials
	enable_event_scheduler
	promptFor DB_NAME "FIX_DB" "the name of the mysql database to upgrade"
	check_no_db $DB_NAME
	if [ $? -ne 0 ]; then 
		error_exit "Fatal: database '$DB_NAME' does not exist so cannot upgrade"
	fi
	#detect current schema version
	run_sql_query "SELECT major FROM $DB_NAME.version"
	VERS=`cat $COMMAND_OUTPUT_FILE`
	if [ $VERS -ne 1 ]; then 
		error_exit "Fatal: invalid database version ($VERS.x) for upgrade"
	fi
	
	run_sql_query "SELECT minor FROM $DB_NAME.version"
	VERS=`cat $COMMAND_OUTPUT_FILE`
	if [ $VERS -eq 0 ]; then
		upgrade1_0
	elif [ $VERS -eq 1 ]; then
		upgrade1_1
	elif [ $VERS -eq 2 ]; then
		echo "Info: schema is current, upgrade not required"
		exit 0
	else
		error_exit "Fatal: Invalid database version (1.$VERS) for upgrade"
		
	fi
}

error_exit(){
	echo
	echo $1
	echo
	teardown
	exit 1
}

success_exit(){
	echo
	echo $1
	echo
	teardown
	exit 0
}

trap error_exit 2
setup
banner

if [ $# -ne 1 ]; then
	usage
elif [ $1 = "-u" ]; then
	do_upgrade
elif [ $1 = "-n" ]; then
	do_new_install
else
	usage
fi

error_exit "Unexpected end of file!"
