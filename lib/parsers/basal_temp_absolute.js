
module.exports = function configure (utils) {
  function parse (row, callback) {

  //'Temp Basal Start':  { bg: true, duration: true,  percent: true,  absolute: true   }
  // 'Temp Basal End':    { bg: true}
  // Adapted to push in temporary basals
  // Requires careportal plugin in Nightscout
  // Currently just picking out manual temp basals, not smartguard (PLGM) - see plgm.js
  // eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  // Note Temp Basal event type (not start / end)
  // Raw Values are ChangeProgrammedTempBasalPercent at start / on
  // Raw Values are ChangeTempBasalPercent at off /cancelation
  // Absolute change only in this script
  
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];

	var values = utils.details(utils.select(row, 'Raw-Values') || '');
  
	if (value == 'ChangeProgrammedTempBasal') {
    var data = {
		value: value,
		eventType: 'Temp Basal',
		duration: parseInt(values.DURATION)/(60.*1000.),
		absolute: parseFloat(values.RATE),
		enteredBy: 'CSV',
		dateString: utils.reformatISO(details['Timestamp']),
		created_at: utils.reformatCPTime(details['Timestamp']),
		date: utils.reformatDate(details['Timestamp'])
	  }
	} 
	  else {
		var data = {
		  value: value,
		  eventType: 'Temp Basal',
		  dateString: utils.reformatISO(details['Timestamp']),
		  created_at: utils.reformatCPTime(details['Timestamp']),
		  date: utils.reformatDate(details['Timestamp'])
		}
    };
	
    return callback(null, data);
  }

  function isValid (data) {
    return data.value || false;
  }
  
  var pattern = /ChangeProgrammedTempBasal|ChangeTempBasal/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}
