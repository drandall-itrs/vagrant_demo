#!/bin/sh

EMAIL=apage@itrsgroup.com

case $_SEVERITY in
        CRITICAL)
                echo $_HOSTNAME, $_PLUGINNAME, $_VARIABLE, $_VALUE > mail.txt.$$
                #env >>  mail.txt.$$
                mailx -s "ITRS Geneos - EMEA Presales Demo Environment" $EMAIL < mail.txt.$$
                rm mail.txt.$$
                ;;
        WARNING)
                echo $_HOSTNAME, $_VARIABLE, $_VALUE > mail.txt.$$
                env >>  mail.txt.$$
                mailx -s "ITRS Geneos - EMEA Presales Demo Environment" $EMAIL < mail.txt.$$
                rm mail.txt.$$
                ;;
        *)
                echo $_HOSTNAME, $_VARIABLE, $_VALUE > mail.txt.$$
                env >>  mail.txt.$$
                mailx -s "ITRS Geneos - EMEA Presales Demo Environment" $EMAIL < mail.txt.$$
                rm mail.txt.$$
                exit
                ;;
esac
