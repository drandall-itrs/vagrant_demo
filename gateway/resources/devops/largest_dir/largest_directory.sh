#!/bin/ksh

#set -x

dir=/opt/geneos/gateway/resources/devops/largest_dir

cd /
sudo du -ckx | sort -n > $dir/$$.out


top_x=`cat $dir/top_x.out`
top_x_sanitised=`echo $top_x | expr $(( top_x + 2 ))`
top_x_output=$top_x
top_size_info=`tail -${top_x_sanitised} $dir/$$.out > $dir/$$_requested.out`
count=$top_x

echo "size_ranking,size,directory"

tail -$top_x_sanitised $dir/$$_requested.out | head -$top_x | while read line
do
        info=`echo $line | sed 's/\s\./,/`
        echo "Top $count directory size,$info"
        count=$(( count - 1 ))
done

echo "<!>Top number of directories, $top_x"
rm $dir/$$.out
rm $dir/$$_requested.out
