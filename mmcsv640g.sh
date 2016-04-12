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
VERSION='V0.85 1st April 2016'
echo $VERSION
#
# Indebted to Ben West for mmcsv - these js are tweaks and additions to his original parsing options
# CareLink Uploader (ie not using Firefox) is provided by Tom Collins - thanks Tom!
# Currently using crude logic here to keep things moving, with limited error trapping...
# Split up jsons for debug - no need, just split entries, treatments to be more efficient...
# Please use with caution. There'll be bugs here...
# You run this at your own risk.
# Thank you.

# ****************************************************************************************
# Known Issues TO (TRY TO) FIX - 
# **************************************************************************************** 
# Dropping the odd data point between uploads - overhaul data selection to use timestamp and not line number... 
# Medtronic Predicted SG values bunch up horribly on >3hr or narrow browser display, not being rescaled. Change sample rate? eg display every other?
# ****************************************************************************************


# ****************************************************************************************
# Assumes running CareLink Uploader or running along with Selenium script (usually looking to upload data at 1, 6, 11, 16, ..., 56 minutes past)
# Import variables from config.sh script
# You must include the directory of your config script when calling 
echo Importing Varables...
source "$1"/config.sh
# ****************************************************************************************
# Let's go...
# ****************************************************************************************

echo Clearing Up CSV Download Directory in ten seconds...
echo $DownloadPath
sleep 10s
rm -f "$DownloadPath"/*.csv

# Get to the right place locally...
export PATH=$PATH:$NodejsPath
echo Using Data Directory
cd "$CSVDataPath"
pwd
echo Clearing Up CSV Files...
rm -f "$CSVDataPath"/*.csv

# Capture empty JSON files later ie "[]"
EMPTYSIZE=3 #bytes

# Uploader setup
START_TIME=0	#last time we ran the uploader (if at all)

# Allow to run for ~240 hours (roughly), ~5 min intervals
# This thing is bound to need some TLC and don't want it running indefinitely...
COUNT=0
MAXCNT=2880
until [ $COUNT -gt $MAXCNT ]; do
echo
echo Clearing Up CSV Download Directory...
rm -f "$DownloadPath"/*.csv

# Splits here - Firefox or CareLink Uploader module)
if [ $uploader -eq 0 ] 
then
echo "Using Firefox and Selenium..."
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

else
	echo "Using CareLink Uploader..."
	while [ $((10#$(date +'%s')/60-$START_TIME)) -lt $gap_mins_delay ] ; 
	do 
		sleep 30s	# check every 30 seconds 
	done
	while [ ! -s "$DownloadPath"/*.csv ] ; # changed to -s to check for empty csv files also
	do
		if [ $((10#$(date +'%s')/60-$START_TIME)) -ge $gap_mins ] 
		then
			START_TIME=$((10#$(date +'%s')/60))
			"$Mmcsv640gPath"$"/uploader/CareLinkUploader" "$1"$"/config.sh" &
		fi
	sleep 30s  # check every 30 seconds
	done
	sleep 10s # in case we've just stumbled across the file before it's finished downloading... inotifywait would be better solution for another day...
fi 	

if [ $COUNT -eq 0 ]
then
	# Update date format if required - first cycle only
	echo First Run - Checking Regional CareLink Settings
	if [ -z "$carelink_timestamp" ] 
		then 
			echo Timestamp not found in config.sh - setting to default
			carelink_timestamp='DD/MM/YYTHH:mm:ss' # UK Regional Settings
		fi
	CARELINK_LINE="var CARELINK_TIME = '"$"$carelink_timestamp"$"' ;"
	echo $carelink_timestamp
	sed -i "s+^var CARELINK_TIME.*+$CARELINK_LINE+g" "$Mmcsv640gPath"/lib/utils.js	
fi
	
# We've found a CSV file... hooray
uploaded_recent_file=$(ls -t "$DownloadPath"/*.csv | head -1)
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
sed -n $LAST_LINESBUTONE,'$p' $CSVDataPath/latest640g.csv > $CSVDataPath/use640g_orig.csv
echo

# Regional tweaks - multiple files generated for debug
# Check for decimal comma within quotes and convert to decimal point (e.g. some euro regions)
sed 's/"\([0-9]*\),\([0-9]*\)"/\1.\2/g' $CSVDataPath/use640g_orig.csv > $CSVDataPath/use640g_temp.csv

# Check for decimal comma within ; and convert to decimal point (e.g. some euro regions)
sed 's/;\([0-9]*\),\([0-9]*\)/\1.\2,/g' $CSVDataPath/use640g_temp.csv > $CSVDataPath/use640g_temp1.csv

# Check for decimal comma with preceeding = and convert to decimal point (e.g. some euro regions)
sed 's/=\([0-9]*\),\([0-9]\)/=\1.\2/g' $CSVDataPath/use640g_temp1.csv > $CSVDataPath/use640g_temp2.csv

# Check for decimal comma with preceeding = and - and convert to decimal point (e.g. some euro regions)
sed 's/=-\([0-9]*\),\([0-9]\)/=-\1.\2/g' $CSVDataPath/use640g_temp2.csv > $CSVDataPath/use640g_temp3.csv

# Replace semicolon delimiter with a comma
sed 's/;/,/g' $CSVDataPath/use640g_temp3.csv > $CSVDataPath/use640g.csv

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

echo Basal - Absolute
"$Mmcsv640gPath"/bin/cmd.js parse --filter=basal $CSVDataPath/use640g.csv > $CSVDataPath/latest640g_basal.json
filesize=$(wc -c <"$CSVDataPath"$"/latest640g_basal.json")
if [ $filesize -gt $EMPTYSIZE ]
then
	curl -vs -X POST --header "Content-Type: application/json" --header "Accept: application/json" --header "api-secret:"$api_secret_hash --data-binary @latest640g_basal.json "$your_nightscout"$"/api/v1/treatments"
fi
echo

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