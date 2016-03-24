#! /bin/bash
# Simple script to check 
# - if Virtual Here is running
# - if the USB device has disconnected
# @LittleDMatt
# V0.1 22nd March 2016

# Run as root
# !!Warning: Reboots your machine if required!!
# Designed to be run as regular (5 minute) crontab job
# Tested on a CHIP linux pc with VirtualHere v2.7.8

# Housekeeping
cd /root
rm -f vh.log
rm -f vh_check.log
rm -f vh_disconnect.log

grep vhusbdarm /var/log/syslog | tail -1 > /root/vh.log

# Check if we crashed and burned starting up...
grep '>>> Shutdown <<<' /root/vh.log > /root/vh_check.log
# last line of vh.log will have >>> Shutdown <<< if we're stuck
# Action (if required): try restarting in background
if [ -s /root/vh_check.log  ] 
then 
/usr/sbin/vhusbdarm -b
fi

# Check if we've lost the Bayer Stick...
grep 'Unmanaging device' /root/vh.log | tail -1 > /root/vh_disconnect.log
# last line of vh.log will have Unmanaging device if we're stuck
# Action (if required): reboot (ffs, got to be a better way :o )
if [ -s /root/vh_disconnect.log  ] 
then 
/sbin/reboot
fi