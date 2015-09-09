#!/bin/ksh

route_address=$1
dir=/opt/geneos/gateway/resources/devops/network/routing/
file=traceroute_destination

echo $route_address > $dir/$file
