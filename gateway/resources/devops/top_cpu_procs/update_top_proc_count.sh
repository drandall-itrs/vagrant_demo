#!/bin/ksh

top_x=$1
top_x_normalised=`expr $(( top_x + 1 ))`
dir=/opt/geneos/gateway/resources/devops/top_cpu_procs
file=top_x.out

echo $top_x_normalised > $dir/$file
