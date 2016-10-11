module.exports = function configure (utils) {
  function exists (d) { return d; }
  function lower (d) { return d.toLowerCase( ); }

// CarePortal adjustments
// Bolus will handle insulin delivery ONLY
// Wizard will handle planned delivery, carbs and estimate
// ie both wizard and bolus need to be called
// eventType = ("Correction Bolus"), "Meal Bolus", ("Snack Bolus")
// eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
// bg, carbs not used here!
// insulin used
// notes used to record if all planned bolus was delivered (or cancelled eg due to PLGM) - CHECK THIS ON THE PUMP OF COURSE!
// rest are left for info and possible future use
    
  function parse (row, callback) {
    var keys = [ 'Bolus Type', 'Timestamp', 'Raw-Values',
                 'Raw-Upload ID', 'Index', 'Raw-Device Type' ];
    var fields = utils.pluck(row, keys);
    var index = parseInt(fields.Index);
    var device = fields['Raw-Device Type'];
    var details = utils.details(fields['Raw-Values'] || '');
    var delivered = details.AMOUNT;
    var programmed = details.PROGRAMMED_AMOUNT;
	var gap_value = (programmed - delivered).toFixed(3);	// ie to capture if anything was lost in eg pump suspend or other pump error...
	var gap_message = "Delivered";
	if (gap_value > 0) {
		gap_message = gap_value.toString() + "U CANCELLED";
	}
	var duration = details.DURATION;
	duration_mins = (duration / 60000.).toFixed(); // in minutes
	var enteredText = 'Now';
	if (lower(fields['Bolus Type'] || '') == 'dual/square') {
		enteredText = (duration_mins).toString() + "mins ago";
	}
    var data = {
      value: delivered,
      insulin: parseFloat(delivered),
      programmed: parseFloat(programmed),
      type: 'bolus',
      subType: lower(fields['Bolus Type'] || ''),
	  eventType: 'Meal Bolus',
	  enteredBy: enteredText,
	  notes: gap_message,	
      dateString: utils.reformatISO(fields.Timestamp),
	  created_at: utils.reformatCPTime(fields.Timestamp),
	  date: utils.reformatDate(fields.Timestamp)

    };
    if (duration) {
      data.duration = parseInt(duration_mins);
    }
    if (details.IS_DUAL_COMPONENT === 'true') {
      if (data.subType == 'dual/square') {
        index--;
      }
    }
    data.joinKey = utils.hash([fields['Raw-Upload ID'], index, device].join(' '));

    return callback(null, data);
  }

  function isValid (data) {
    return (!isNaN(data.value) && data.type === 'bolus' && data.subType !== '');
  }
  var pattern = /BolusNormal|BolusSquare/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

