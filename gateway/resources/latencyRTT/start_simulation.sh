#!/bin/csh
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here.txt
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here2.txt
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here3.txt
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here4.txt
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here5.txt
rm /opt/local/geneos-install/resources/latencyRTT/slowcat2here6.txt
/opt/local/geneos-install/resources/latencyRTT/simulatedata.sh &
/opt/local/geneos-install/resources/latencyRTT/simulatedata2.sh &
/opt/local/geneos-install/resources/latencyRTT/simulatedata3.sh &
/opt/local/geneos-install/resources/latencyRTT/simulatedata4.sh &
/opt/local/geneos-install/resources/latencyRTT/simulatedata5.sh &
/opt/local/geneos-install/resources/latencyRTT/simulatedata6.sh &
