#! /bin/bash
# Initialising Carelink Automation
# Proof of concept ONLY - 640g csv to NightScout
#
# ****************************************************************************************
# USER SPECIFIC Working Directories - Please enter your details here
# ****************************************************************************************
# ExamplePath='/c/Data/Path' 
# NB NO SPACES anywhere here, unless you know what you're doing please - Welcome to Shell Scripting :-)
Mmcsv640gPath='/c/Users/matt/Nightscout/csv/mmcsv' #Installation Directory for mmscv640g stack
CSVDataPath='/c/Users/matt/AutoCSV' # The directory you want to throw all the data around in
DownloadPath='/c/Users/matt/Downloads' # Where your CSV file downloaded from CareLink will appear (without any IMPORTANT CSV files in it!)
NodejsPath='/c/Program Files/nodejs' # Where Nodejs installed on your system
MousePath='/c/Users/matt/Nightscout' #Where MiniMouseMacro is installed
# ****************************************************************************************
# USER SPECIFIC Variables - Please enter your values here
# ****************************************************************************************
api_secret_hash='2ce212ef676099da17ec5aff64db0c83bf3f7b4f' # This is the SHA-1 Hash of your API-SECRET string - eg "ASANEXAMPLE1" is transformed into...
your_nightscout='https://yourwebsite.azurewebsites.net' #'https://something.azurewebsites.net'
gap_mins=5 # max time to wait for CSV download. Suggest 5 or 10 minutes and always start higher
gap_mins_delay=0 # use strict time for each upload cycle (if >0) or don't wait to minimise latency (0)
carelink_timestamp='DD/MM/YYTHH:mm:ss' # Please select one of these by removing the # from the beginning of just ONE option
#carelink_timestamp='MM/YY/YYTHH:mm:ss' # Please select one of these by removing the # from the beginning of just ONE option
#carelink_timestamp='YYYY-MM-DDTHH:mm:ss' # Please select one of these by removing the # from the beginning of just ONE option
#carelink_timestamp='DD-MM-YYYYTHH:mm:ss' # Please select one of these by removing the # from the beginning of just ONE option

# ****************************************************************************************
# USER SPECIFIC Uploader Info - Please enter your values here
# ****************************************************************************************
uploader=1 #Firefox + Selenium (0) or .NET uploader (1): default is 1 from version  0.8 onwards
CareLinkURL='https://carelink.minimed.eu' #CareLink site, .eu or .com
CareLinkUsername='user' #CareLink Username
CareLinkPassword='password' #CareLink Password