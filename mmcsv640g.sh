#! /bin/bash
# Initialising Carelink Automation
# Proof of concept ONLY - 640g csv to NightScout
#
echo '*****************************'
echo '***       MMCSV640G       ***'
echo '*** FOR TEST PURPOSES ONLY***'
echo '*Only Use If You Accept This*'
echo '* Started 12th November 2015*'
echo '*** Thanks - @LittleDMatt ***'
echo '*****************************'
VERSION='V0.73 7th January 2016'
#
# Indebted to Ben West for mmcsv - these js are tweaks and additions to his original parsing options
# Currently using crude logic here to keep things moving, with limited error trapping...
# Split up jsons for debug - no need, just split entries, treatments to be more efficient...
# Please use with caution. There'll be bugs here...
# You run this at your own risk.
# Thank you.

# ****************************************************************************************
# Known Issues TO (TRY TO) FIX - 
# ****************************************************************************************
# Doesn't change over to latest date on CSV upload - log out and back in again in Selenium script but need to avoid Medtronic browser alert page if you do...
# Dropping the odd data point between uploads - overhaul data selection to use timestamp and not line number... 
# Medtronic Predicted SG values bunch up horribly on >3hr or narrow browser display, not being rescaled. Change sample rate? eg display every other?
# Double vision-currently clears out CSV files to prevent IO error on pause to look for CSV files - an easy fix when I'm more awake... 
# ****************************************************************************************


# ****************************************************************************************
# Assumes run along with Selenium script
# Usually looking to upload data at around 1, 6, 11, 16, ..., 56 minutes past
# Import variables from config.sh script
# You must include the directory of your config script when calling 
echo Importing Varables...
source "$1"/config.sh
# ****************************************************************************************
# Let's go...
# ****************************************************************************************
echo $VERSION

echo Clearing Up CSV Download Directory in ten seconds...
sleep 10s
rm -f "$DownloadPath"/*.csv

# Get to the right place locally...
export PATH=$PATH:$NodejsPath
cd "$CSVDataPath"
pwd
sleep 50
# Capture empty JSON files later ie "[]"
EMPTYSIZE=3 #bytes

# Allow to run for ~240 hours (roughly), ~5 min intervals
# This thing is bound to need some TLC and don't want it running indefinitely...
COUNT=0
MAXCNT=2880
until [ $COUNT -gt $MAXCNT ]; do
echo
echo Clearing Up CSV Download Directory...
rm -f "$DownloadPath"/*.csv

echo "Waiting for CareLink upload page..."
# Extract minutes past each hours and start at preset time (10# forces base ten to avoid errors with leading 0 in returned value, eg at 08 mins)
	while [ $((10#$(date +'%M') % $gap_mins)) -ne 0 ] ; 
	do
		sleep 30s # check every 30 seconds
	done	
# Wait 1 minute post Selenium call up of upload page
echo "Waiting for Mouse Click on upload page..."
sleep 1m

# Going to run MiniMouseMacro to perform mouse click on upload page
# MiniMouseMacro and a valid mmcsv640g.mmmacro file must be present in MousePath
echo "Uploading..."
"$MousePath"$"/MiniMouseMacro" //e //m "$MousePath"$"/mmcsv640g.mmmacro"

# mm640g sometimes panics on first connection attempt - try clicking again soon after first try...
# (this will either do nothing - we're uploading - or click the Retry button)
sleep 45s
"$MousePath"$"/MiniMouseMacro" //e //m "$MousePath"$"/mmcsv640g.mmmacro"

echo 
sleep 2m	# at least a two minute wait for upload and transfer to CSV report page... 
echo "Waiting for valid CSV file download from Carelink"
	while [ ! -s "$DownloadPath"/*.csv ] ; # changed to -s to check for empty csv files also
	do 
		sleep 30s	# check every 30 seconds 
	done

# We've found a CSV file... hooray
uploaded_recent_file=$(ls -t "$DownloadPath"/*.csv | head -n1)
echo "$uploaded_recent_file"
echo
#move the file to the Data Directory and rename
mv "$uploaded_recent_file" "$CSVDataPath"/latest640g.csv

# ****************************************************************************************
# Trim CSV to reflect only new entries since last poll (latest640gbutone.csv)
# Important to do this to cut down on duplicate entries in NS
# (these might cause issues esp in CarePortal, but also add to your data)
# First lose the header preamble	
sed -i '1,11d' $CSVDataPath/latest640g.csv

echo
echo Number of Entries in latest CSV file
if [ -s $CSVDataPath/latest640g.csv ]
then
	LAST_LINES=$(awk '{n+=1} END {print n}' $CSVDataPath/latest640g.csv)
else
	LAST_LINES=1
fi
echo $LAST_LINES

echo
echo Number of Entries in latest but one CSV file
if [ -s $CSVDataPath/latest640gbutone.csv ]
then
	LAST_LINESBUTONE=$(awk '{n+=1} END {print n}' $CSVDataPath/latest640gbutone.csv)
else
	LAST_LINESBUTONE=1
fi

# Check for null return
if [ $LAST_LINESBUTONE -le 0 ]
then
	LAST_LINESBUTONE=1
fi
echo $LAST_LINESBUTONE
echo

# If LAST_LINESBUTONE > LAST_LINES then must be new day's CSV ; set LAST_LINESBUTONE to one ie keep latest640g.csv intact
if [ $LAST_LINESBUTONE -gt $LAST_LINES ]
then
	LAST_LINESBUTONE=1
fi

# If LAST_LINESBUTONE = LAST_LINES then same CSV file ie pump upload failed skip...
if [ $LAST_LINESBUTONE -ne $LAST_LINES ]
then
echo Extract Newly Generated Entries Only
sed -n $LAST_LINESBUTONE,'$p' $CSVDataPath/latest640g.csv > $CSVDataPath/use640g.csv
echo

# ****************************************************************************************
# Don't parse 'all' to entries as generates a ton of wasted entries in DB
# Time to extract and upload entries (SG and BG)
echo "Entries - SG and BG Data"
echo CBG
"$Mmcsv640gPath"/bin/cmd.js parse --filter=cbg $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_sg.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_sg.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_sg.json "$your_nightscout"$"/api/v1/entries"
fi
echo
echo SMBG
"$Mmcsv640gPath"/bin/cmd.js parse --filter=smbg $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_bg.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_bg.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_bg.json "$your_nightscout"$"/api/v1/entries"
fi

# ****************************************************************************************
# Time to extract and upload treatments
# Step-by-step to aid debugging, not very slick...
echo
echo "Treatments - Basal Changes (percent and absolute), PLGM, Cannula Change, Sensor Start, Bolus and Wizard"

echo PLGM - SmartGuard
"$Mmcsv640gPath"/bin/cmd.js parse --filter=plgm $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_plgm.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_plgm.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_plgm.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Temp Basal - Percentage
"$Mmcsv640gPath"/bin/cmd.js parse --filter=basal_temp_percent $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_temp_basal_percent.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_temp_basal_percent.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_temp_basal_percent.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Temp Basal - Absolute
"$Mmcsv640gPath"/bin/cmd.js parse --filter=basal_temp_absolute $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_temp_basal_absolute.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_temp_basal_absolute.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_temp_basal_absolute.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Site Change
"$Mmcsv640gPath"/bin/cmd.js parse --filter=insulin $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_insulin.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_insulin.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_insulin.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Sensor Change
"$Mmcsv640gPath"/bin/cmd.js parse --filter=sensor_start $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_sensor_start.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_sensor_start.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_sensor_start.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Bolus Wizard
"$Mmcsv640gPath"/bin/cmd.js parse --filter=wizard $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_wizard.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_wizard.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_wizard.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo Bolus Delivered
"$Mmcsv640gPath"/bin/cmd.js parse --filter=bolus $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_bolus.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_bolus.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_bolus.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

echo SKIPPING Medtronic Predictions - As Notes
#"$Mmcsv640gPath"/bin/cmd.js parse --filter=medpredict $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_medpredict.json
#filesize=$(wc -c <"$CSVDataPath"$"/latest640g_medpredict.json")
#if [ $filesize -gt $EMPTYSIZE ]
#then
#	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_medpredict.json "$your_nightscout"$"/api/v1/treatments"
#fi
echo

echo Pump Alarms - As Announcements
"$Mmcsv640gPath"/bin/cmd.js parse --filter=pump_alarms $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_pump_alarms.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_pump_alarms.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_pump_alarms.json "$your_nightscout"$"/api/v1/treatments"
fi
echo
fi # found a file to process
echo
let COUNT=COUNT+1
echo $COUNT
echo "Tidying Up..."
mv $CSVDataPath/latest640g.csv $CSVDataPath/latest640gbutone.csv
done