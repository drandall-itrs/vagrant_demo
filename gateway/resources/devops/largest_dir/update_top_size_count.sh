#!/bin/ksh

top_x=$1
top_x_normalised=$top_x
dir=/opt/geneos/gateway/resources/devops/largest_dir
file=top_x.out

echo $top_x_normalised > $dir/$file
