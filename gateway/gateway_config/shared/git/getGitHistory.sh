#!/bin/bash
echo "TS,Hash,Date,Committer,Location,Subject"
git log -n 50 --format=%at,%H,%ad,%an,%aE,%s
