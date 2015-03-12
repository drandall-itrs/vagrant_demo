#!/bin/sh
# ==============================================================
# Script name :         ItrsEmailScript
# Date Written :        22/03/09
# Written by :          Adapted for GW2
# Description :         Script to send e-mail to support teams.
# ==============================================================

# ================
# Define Variables
# ================
EMAIL=$1
DATE=`date +"%d/%m/%Y"`
SCRIPT=`basename $0`
TIME=`date +"%H:%M:%S"`
day=`date +"%a"`
dat=`date +"%d"`
mon=`date +"%b"`
year=`date +"%Y"`
time=`date +"%H:%M:%S"`
readby=`date +"%z"`
DATE=`date +"%d/%m/%Y"`
REVERSEDATE=`date +"%Y%m%d"`
OutputFile=Test$$.html

#Decide which search field to use.  If the process name is given then use it.  Otherwise use the entity

          if [ "$_processName" == "" ]
          then
                SEARCH_FIELD=$_HOSTNAME
          else
                SEARCH_FIELD=$_processName
          fi


#Handle blank fields

          if [ "$_processName" == "" ]
          then
                _processName="Not Available"
          fi

          if [ "$_user" == "" ]
          then
                _user="Not Available"
          fi

          
####### Set the alert types

        if [ "$_VARIABLE" != "" ] 
         then
         ALERT_TYPE="$_SAMPLER"
         SHORT_COMMENT=""
         LONG_COMMENT="Please check ITRS for the details."
        fi

### PROCESS DOWN
          if [ "$_SAMPLER" == "processes" ]
           then
              if [ "$_VALUE" == "0" ] 
              then
                ALERT_TYPE="PROCESS-DOWN"
                SHORT_COMMENT="Process down" 
                LONG_COMMENT="The process '$_processName' is not running" 
              else
                ALERT_TYPE="PROCESSES"
                SHORT_COMMENT="Process instance count incorrect"
                LONG_COMMENT="Incorrect number of '$_processName' processes running."
              fi
           fi
### FKM
          if [ "$_SAMPLER" == "fkm" ]
           then
           ALERT_TYPE="FKM"
           SHORT_COMMENT="FKM"
           LONG_COMMENT="An FKM alert has been triggered on the '$_name' file."
          fi
### CPU
          if [ "$_SAMPLER" == "cpu" ]
           then
           ALERT_TYPE="CPU"
           SHORT_COMMENT="CPU"
           LONG_COMMENT="CPU alert has been triggered, please check ITRS for the details."
          fi

### DISK
          if [ "$_SAMPLER" == "disk" ]
          then
                ALERT_TYPE="DISK"
                SHORT_COMMENT="DISK"
                LONG_COMMENT="Disk space alert has been triggered, please check ITRS for the details."
          fi

### NETWORK
          if [ "$_SAMPLER" == "network" ]
          then
                ALERT_TYPE="NETWORK"
                SHORT_COMMENT="NETWORK"
                LONG_COMMENT="Network parameter alert has been triggered, please check ITRS for the details."
          fi

### HARDWARE
          if [ "$_SAMPLER" == "hardware" ]
          then
                ALERT_TYPE="HARDWARE"
                SHORT_COMMENT="HARDWARE"
                LONG_COMMENT="There is some hardware problem on this machine, please check ITRS for the details."
          fi

#        fi


#######   Check if USERDATA set in rule and use SHORT_COMMENT if not
          if [ "$_USERDATA" == "" ]
           then
           _USERDATA=$SHORT_COMMENT
          fi          

####### Check if Probe or Host is down
        if [ X"$_MANAGED_ENTITY" == X"$TOWN$REGION" ] 
         then
         ALERT_TYPE="PROBE or HOST DOWN on $_NETPROBE_HOST"
#         _MANAGED_ENTITY="$_REALHOSTID"
         _MANAGED_ENTITY=""
         SHORT_COMMENT=""
         LONG_COMMENT="Please check ITRS for the details."
        fi


#######   Create the email headers
echo "To: $EMAIL" > $OutputFile
                        echo "Subject:$_GATEWAY$APPL_NM $_SEVERITY" - $_MANAGED_ENTITY - $ALERT_TYPE >> $OutputFile
                        echo "Date: $day, $dat $mon $year $time $readby">> $OutputFile
                        echo "X-MS-Has-Attach:" >> $OutputFile
                        echo "X-MS-TNEF-Correlator:" >> $OutputFile
                        echo "MIME-Version: 1.0">> $OutputFile
                        echo "Content-Type: text/html; charset=us-ascii">> $OutputFile
                        echo "Content-Transfer-Encoding: 7bit">> $OutputFile
                        echo "Content-Disposition: inline; filename=CreateHTML.mail">>  $OutputFile
                        echo "From:<ITRS>">>  $OutputFile


echo "<TEXTFORMAT LEADING="2"><P ALIGN="LEFT"><FONT FACE="Arial" SIZE="3" COLOR="#007FFF" LETTERSPACING="0" KERNING="0">" >> $OutputFile

############################################### Standard message identifying gateway ###############################################

echo "This Message has been generated by the ITRS $_GATEWAY$APPL_NM monitoring system at $DATE:$TIME." >> $OutputFile

####################################################################################################################################

echo "<br>" >> $OutputFile
echo "<br>" >> $OutputFile

####### Set colour for warning severity

                                        if [ "$_SEVERITY" == "WARNING" ]
                                        then
                        echo "<TABLE BORDER=1 CELLPADDING=3 CELLSPACING=0 BGCOLOR=#FFCC00 BORDERCOLOR=#007FFF>">> $OutputFile

                                                        
                                                        echo "<TR>" >> $OutputFile
                                                        echo "  <TD><b>Location</b></TD>" >> $OutputFile
                                                        echo "  <TD>$TOWN$REGION</TD>" >> $OutputFile
                                                        echo "</TR>" >> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Gateway</b></TD>">> $OutputFile
                                                        echo "  <TD>$_GATEWAY$APPL_NM</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Entity</b></TD>">> $OutputFile
                                                        echo "  <TD>$_MANAGED_ENTITY</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Server</b></TD>">> $OutputFile
                                                        echo "  <TD>$_NETPROBE_HOST</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                echo "</TABLE>">> $OutputFile
                                                echo "<br>" >> $OutputFile

                                                   fi

####### Set colour for critical severity

                                        if [ "$_SEVERITY" == "CRITICAL" ]
                                                then
                        echo "<TABLE BORDER=1 CELLPADDING=3 CELLSPACING=0 BGCOLOR=#FF3E3E BORDERCOLOR=#007FFF>">> $OutputFile

                                                        echo "<TR>" >> $OutputFile
                                                        echo "  <TD><b>Location</b></TD>" >> $OutputFile
                                                        echo "  <TD>$TOWN$REGION</TD>" >> $OutputFile
                                                        echo "</TR>" >> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Gateway</b></TD>">> $OutputFile
                                                        echo "  <TD>$_GATEWAY$APPL_NM</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Entity</b></TD>">> $OutputFile
                                                        echo "  <TD>$_MANAGED_ENTITY</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Server</b></TD>">> $OutputFile
                                                        echo "  <TD>$_NETPROBE_HOST</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                echo "</TABLE>">> $OutputFile
                                                echo "<br>" >> $OutputFile
                                                fi


                                                echo "<TABLE BORDER=1 CELLPADDING=3 CELLSPACING=0 BORDERCOLOR=#007FFF>">> $OutputFile

                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Alert Type</b></TD>">> $OutputFile
                                                        echo "  <TD>$ALERT_TYPE</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Rule</b></TD>">> $OutputFile
                                                        echo "  <TD>$_VARIABLE</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Error Message / Value</b></TD>">> $OutputFile
                                                        echo "  <TD>$_VALUE</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Comments</b></TD>">> $OutputFile
                                                        echo "  <TD>$_USERDATA</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                        echo "<TR>">> $OutputFile
                                                        echo "  <TD><b>Comments</b></TD>">> $OutputFile
                                                        echo "  <TD>$LONG_COMMENT</TD>">> $OutputFile
                                                        echo "</TR>">> $OutputFile


                                                echo "</TABLE>">> $OutputFile
                                                echo "<br>" >> $OutputFile



########################################## Standard message pointing to ITRS Sharepoint ###########################################

echo "<br>" >> $OutputFile

echo "The relevant Application Support team should take appropriate action to fix this alert.  For General ITRS information visit the" >> $OutputFile
 
echo "<a href=\"http://tech.us.com/sites/ITRS/default.aspx\"> ITRS SharePoint</a>">>  $OutputFile

echo "<br>" >> $OutputFile

#echo "</FONT></P></TEXTFORMAT></BODY>" >> $OutputFile

####################################################################################################################################

#######   Send the email

/usr/lib/sendmail -i -t -O ErrorMode=q < $OutputFile

rm $OutputFile

#######   Copy to log file to confirm script ran

echo  "$DATE:$TIME:$TOWN$REGION:$_GATEWAY$APPL_NM:$_SEVERITY:$_MANAGED_ENTITY:$_NETPROBE_HOST:$_processName:$_user:$_Description:$_USERDATA:$_VARIABLE:$_VALUE:$_Info:  $_triggerDetails" >> /opt/geneos/gateway/logs/EMAIL-$REVERSEDATE-$TOWN$REGION$_GATEWAY$APPL_NM.out

####### Uncomment the following line temporarily to see what variables are output to a script from ITRS ########
#/bin/env > ./showenv
exit 0
