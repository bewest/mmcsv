
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Using careportal "Temp" basal to add values of SCHEDULED basal change (not perfect I know...)
  // Using this will over-ride your basal PROFILE set in Nightscout...
  //'Temp Basal Start':  { bg: true, duration: true,  percent: true,  absolute: true   }
  // Requires careportal plugin in Nightscout
  // Just picking out SCHEDULED basal changes here
  // eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  // Note Temp Basal event type (not start / end)
  // Raw Values are BasalProfileStart at start / on
  // Absolute values (units per hour) only in this script
  // Duration is preset to 24 hours - ie tees this up until next rate is spotted...
  // NOT used at present...
  
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];

	var values = utils.details(utils.select(row, 'Raw-Values') || '');
  
	if (value == 'BasalProfileStart') {
    var data = {
		value: values.RATE,
		eventType: 'Temp Basal',
		duration: parseInt(1440),
		absolute: parseFloat(values.RATE),
		enteredBy: 'CSV',
		dateString: utils.reformatISO(details['Timestamp']),
		created_at: utils.reformatCPTime(details['Timestamp']),
		date: utils.reformatDate(details['Timestamp'])
	  }
	} ;
	 
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
