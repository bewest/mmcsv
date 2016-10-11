
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Place Medtronic's Predicted SG value in mmol/L (I know, I know...) to NS as a notes
  // placing 5 minute note, 25 minutes in advance (so that it's visible)
  // should represent Medtronic's estimate of SG in 30 minutes time post Timestamp
  // Requires careportal plugin in Nightscout
  // eventTime: 'hh:mm', 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    
	var moment = require('moment');
    var fields = utils.pluck(row, ['Raw-Values', 'Timestamp']);
    var details = utils.details(fields['Raw-Values'] || '');
    var predicted_mgdl = details.PREDICTED_SENSOR_GLUCOSE_AMOUNT;
	predicted_value = (predicted_mgdl / 18.1).toFixed(1);
	var current_date = utils.reformatDate(fields['Timestamp']);
	new_date =  current_date + 25.*60. * 1000.;
	var new_m = moment(new_date);
    var data = {
		value: predicted_mgdl,	// in mg/dL
		eventType: 'Note',
		enteredBy: 'CSV',
		duration: 5,
		notes: predicted_value.toString(), // Predicted Value in mmol/L
		dateString: new_m.format('YYYY-MM-DDTHH:mm:ss'),
		created_at: new_m.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
		date: new_date
	  };
	
    return callback(null, data);
  }

  function isValid (data) {
    return (!isNaN(data.value)) || false;
  }
  
  var pattern = /GlucoseSensorData/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
