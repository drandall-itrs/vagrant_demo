#!/bin/bash
echo "TS,DateTime,Hash,Date,Committer,Location,Subject"
git log -n 50 --format=%at,%ai,%H,%ad,%an,%aE,%s
