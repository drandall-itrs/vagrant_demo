#!/bin/bash
if [ -z "$1" ];  then
    echo "Error: Comment is mandatory" 1>&2
    exit 1
else
    git commit -m "$*"
fi

