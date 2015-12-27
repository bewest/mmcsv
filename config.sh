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
gap_mins=10 # time between CSV uploads (roughly). Suggest betweem 5 and 10 minutes and always start higher