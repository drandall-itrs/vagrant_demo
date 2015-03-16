Introduction
============

Presales EMEA demo Geneos environment.

Installing
==========

 * Checkout this repository
 * Install Geneos binaries into the package directory
 ** You will need to install Gateway, various Netprobe, licd binaries and create active_prod* symbolic links.  See relevant README's for more details.
 * The Windows probe can run on your local windows machine is configured using the network name WIN-HOST.
 ** Create an entry in /etc/hosts to point back to this eg: 192.168.10.136  WIN-HOST
 * Use bin/*ctl to start the processes
  
 Things still TODO
 =================
 
 * MySQL
 * Floating probe
 * Webserver / Webmontage
 * JMX hosts
 * init.d on startup
 