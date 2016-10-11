#! /bin/bash
################################
# Simple script to check 
# - if Virtual Here is running
# - if the USB device has disconnected
# - if the battery is too low or too hot
# Work in progress to control CHIP / Pi with VirtualHere
# @LittleDMatt
# V0.21 15th April 2016

################################
# Run as root / as cron job - */5 * * * * /bin/bash -lc /root/vh_cron.sh will run every five minutes
# !!Warning: Shutsdown and Reboots your machine if required!!
# Battery and power script adapted from battery.sh by RzBo, Bellesserre, France

################################
# Housekeeping
cd /root
rm -f vh.log
rm -f vh_check.log
rm -f vh_disconnect.log

grep vhusbdarm /var/log/syslog | tail -1 > /root/vh.log

################################
# Check if we crashed and burned starting up...
grep '>>> Shutdown <<<' /root/vh.log > /root/vh_check.log
# last line of vh.log will have >>> Shutdown <<< if we're stuck
# Action (if required): try restarting in background
if [ -s /root/vh_check.log  ] 
then 
echo '/usr/sbin/vhusbdarm -b' > /root/vh_action.log
/usr/sbin/vhusbdarm -b
fi

################################
# Check if we've lost the Bayer Stick from the OS...
lsusb > /root/vh_lsusb.log
grep 'Bayer' /root/vh_lsusb.log > /root/vh_usb.log
# Bayer will be listed -  "Bayer Health Care LLC"
# Action (if required): reboot (ffs, got to be a better way :o )
if [ ! -s /root/vh_usb.log  ] 
then 
echo 'reboot - USB Loss' > /root/vh_action.log
/sbin/reboot
fi

################################
# Check if we've lost the Bayer Stick from VirtualHere...
grep 'Unmanaging device' /root/vh.log | tail -1 > /root/vh_disconnect.log
# last line of vh.log will have Unmanaging device if we're stuck
# Action (if required): reboot (ffs, got to be a better way :o )
if [ -s /root/vh_disconnect.log  ] 
then 
echo 'reboot - VH Loss' > /root/vh_action.log
/sbin/reboot
fi

################################
# Check Power status of CHIP
# Adapted from battery.sh by RzBo, Bellesserre, France
# force ADC enable for battery voltage and current
/usr/sbin/i2cset -y -f 0 0x34 0x82 0xC3

################################
#read Power status register @00h
POWER_STATUS=$(i2cget -y -f 0 0x34 0x00)
#echo $POWER_STATUS

BAT_STATUS=$(($(($POWER_STATUS&0x02))/2))  # divide by 2 is like shifting rigth 1 times
# echo $(($POWER_STATUS&0x02))
##echo "BAT_STATUS="$BAT_STATUS
# echo $BAT_STATUS

################################
#read Power OPERATING MODE register @01h
POWER_OP_MODE=$(i2cget -y -f 0 0x34 0x01)
#echo $POWER_OP_MODE

CHARG_IND=$(($(($POWER_OP_MODE&0x40))/64))  # divide by 64 is like shifting rigth 6 times
#echo $(($POWER_OP_MODE&0x40))
## echo "CHARG_IND="$CHARG_IND
# echo $CHARG_IND

BAT_EXIST=$(($(($POWER_OP_MODE&0x20))/32))  # divide by 32 is like shifting rigth 5 times
#echo $(($POWER_OP_MODE&0x20))
## echo "BAT_EXIST="$BAT_EXIST
# echo $BAT_EXIST

################################
#read Charge control register @33h
CHARGE_CTL=$(i2cget -y -f 0 0x34 0x33)
## echo "CHARGE_CTL="$CHARGE_CTL
# echo $CHARGE_CTL


################################
#read Charge control register @34h
CHARGE_CTL2=$(i2cget -y -f 0 0x34 0x34)
## echo "CHARGE_CTL2="$CHARGE_CTL2
# echo $CHARGE_CTL2


################################
#read battery voltage	79h, 78h	0 mV -> 000h,	1.1 mV/bit	FFFh -> 4.5045 V
BAT_VOLT_MSB=$(i2cget -y -f 0 0x34 0x78)
BAT_VOLT_LSB=$(i2cget -y -f 0 0x34 0x79)

#echo $BAT_VOLT_MSB $BAT_VOLT_LSB
# bash math -- converts hex to decimal so `bc` won't complain later...
# MSB is 8 bits, LSB is lower 4 bits
BAT_BIN=$(( $(($BAT_VOLT_MSB << 4)) | $(($(($BAT_VOLT_LSB & 0x0F)) )) ))

BAT_VOLT=$(echo "($BAT_BIN*1.1)"|bc)
## echo "Battery voltage = "$BAT_VOLT"mV"

###################
#read Battery Discharge Current	7Ch, 7Dh	0 mV -> 000h,	0.5 mA/bit	1FFFh -> 1800 mA
#AXP209 datasheet is wrong, discharge current is in registers 7Ch 7Dh
#13 bits
BAT_IDISCHG_MSB=$(i2cget -y -f 0 0x34 0x7C)
BAT_IDISCHG_LSB=$(i2cget -y -f 0 0x34 0x7D)

#echo $BAT_IDISCHG_MSB $BAT_IDISCHG_LSB

BAT_IDISCHG_BIN=$(( $(($BAT_IDISCHG_MSB << 5)) | $(($(($BAT_IDISCHG_LSB & 0x1F)) )) ))

BAT_IDISCHG=$(echo "($BAT_IDISCHG_BIN*0.5)"|bc)
## echo "Battery discharge current = "$BAT_IDISCHG"mA"

###################
#read Battery Charge Current	7Ah, 7Bh	0 mV -> 000h,	0.5 mA/bit	FFFh -> 1800 mA
#AXP209 datasheet is wrong, charge current is in registers 7Ah 7Bh
#(12 bits)
BAT_ICHG_MSB=$(i2cget -y -f 0 0x34 0x7A)
BAT_ICHG_LSB=$(i2cget -y -f 0 0x34 0x7B)

#echo $BAT_ICHG_MSB $BAT_ICHG_LSB

BAT_ICHG_BIN=$(( $(($BAT_ICHG_MSB << 4)) | $(($(($BAT_ICHG_LSB & 0x0F)) )) ))

BAT_ICHG=$(echo "($BAT_ICHG_BIN*0.5)"|bc)
## echo "Battery charge current = "$BAT_ICHG"mA"

###################
#read internal temperature 	5eh, 5fh	-144.7c -> 000h,	0.1c/bit	FFFh -> 264.8c
TEMP_MSB=$(i2cget -y -f 0 0x34 0x5e)
TEMP_LSB=$(i2cget -y -f 0 0x34 0x5f)

# bash math -- converts hex to decimal so `bc` won't complain later...
# MSB is 8 bits, LSB is lower 4 bits
TEMP_BIN=$(( $(($TEMP_MSB << 4)) | $(($(($TEMP_LSB & 0x0F)) )) ))

TEMP_C=$(echo "($TEMP_BIN*0.1-144.7)"|bc)
echo "Internal temperature = "$TEMP_C"c" > /root/vh_temp.log

###################
#read fuel gauge B9h
BAT_GAUGE_HEX=$(i2cget -y -f 0 0x34 0xb9)

# bash math -- converts hex to decimal so `bc` won't complain later...
# MSB is 8 bits, LSB is lower 4 bits
BAT_GAUGE_DEC=$(($BAT_GAUGE_HEX))

echo "Battery gauge = "$BAT_GAUGE_DEC"%" > /root/vh_battery.log

################################
# Power Action
if [ $BAT_GAUGE_DEC -le 5 ] 
then 
echo 'Low Battery' > /root/vh_action.log
/sbin/shutdown
fi

# Heat Action - this is temp of AXP209 power management chip, not the battery, which rests ~5mm above it. R8 chip is on reverse of PCB.
if [ ${TEMP_C%.*} -gt 75 ] 
then 
echo 'Overheat' > /root/vh_action.log
/sbin/shutdown
fi
