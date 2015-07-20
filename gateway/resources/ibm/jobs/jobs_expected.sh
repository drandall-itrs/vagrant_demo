#!/bin/ksh

#set -x

netprobe_dir=/opt/geneos/gateway
main_dir=resources/ibm/jobs

cat $netprobe_dir/$main_dir/jobs_expected.csv | awk -F, '{ print $1","$2","$3","$4 }'
