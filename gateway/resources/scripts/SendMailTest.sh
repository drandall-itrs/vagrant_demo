#!/bin/sh

EMAIL=owatson@itrsgroup.com


case $_SEVERITY in
        CRITICAL)
		echo "Netprobe Host =  $_NETPROBE_HOST 
Managed Entity =  $_MANAGED_ENTITY 
Severity =  $_SEVERITY 
Variable =  $_VARIABLE 
Rule = $_USERDATA 
Value =  $_VALUE" > mail.txt.$$
		
		#echo Netprobe Host =  $_NETPROBE_HOST >> mail.txt.$$
                #echo -n Managed Entity =  $_MANAGED_ENTITY >> mail.txt.$$
		#echo -n Severity =  $_SEVERITY >> mail.txt.$$
		#echo -n Variable =  $_VARIABLE >> mail.txt.$$
		#echo -n Value =  $_VALUE >> mail.txt.$$

                 
		
                mailx -s "My ITRS Alert:"$_MANAGED_ENTITY $EMAIL < mail.txt.$$
                rm mail.txt.$$
                ;;
        WARNING)
                echo "Netprobe Host =  $_NETPROBE_HOST
Managed Entity =  $_MANAGED_ENTITY 
Severity =  $_SEVERITY 
Variable =  $_VARIABLE 
Rule = $_USERDATA 
Value =  $_VALUE" > mail.txt.$$

		
		#echo Netprobe Host =  $_NETPROBE_HOST >> mail.txt.$$
                #echo -n Managed Entity =  $_MANAGED_ENTITY >> mail.txt.$$
		#echo -n Severity =  $_SEVERITY >> mail.txt.$$
		#echo -n Variable =  $_VARIABLE >> mail.txt.$$
		#echo -n Value =  $_VALUE >> mail.txt.$$
		
                mailx -s "My ITRS Alert:"$_MANAGED_ENTITY $EMAIL < mail.txt.$$
                #echo $_freeSpace, $_VARIABLE, $_VALUE, > $_MANAGED_ENTITY > mail.txt.$$
                #mailx -s "My ITRS Alert" $EMAIL < mail.txt.$$
                rm mail.txt.$$
                ;;
        *)
	                echo "Netprobe Host =  $_NETPROBE_HOST
Managed Entity =  $_MANAGED_ENTITY 
Severity =  $_SEVERITY 
Variable =  $_VARIABLE 
Rule = $_USERDATA 
Value =  $_VALUE" > mail.txt.$$

		#echo Netprobe Host =  $_NETPROBE_HOST >> mail.txt.$$
                #echo -n Managed Entity =  $_MANAGED_ENTITY >> mail.txt.$$
		#echo -n Severity =  $_SEVERITY >> mail.txt.$$
		#echo -n Variable =  $_VARIABLE >> mail.txt.$$
		#echo -n Value =  $_VALUE >> mail.txt.$$
		
                mailx -s "My ITRS Alert:"$_MANAGED_ENTITY $EMAIL < mail.txt.$$
                #echo $_freeSpace, $_VARIABLE, $_VALUE, $_MANAGED_ENTITY > mail.txt.$$
                #mailx -s "My ITRS Alert" $EMAIL < mail.txt.$$
                rm mail.txt.$$
                exit
                ;;
esac
