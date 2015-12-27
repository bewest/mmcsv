
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Logs change of insulin
  // Requires careportal plugin in Nightscout
  // SensorReplaced string in Raw-Type for new sensor (not restarted)
  // eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];

	if (value == 'SensorReplaced') {
		var data = {
			value: value,
			eventType: 'Sensor Start',
			enteredBy: 'CSV',
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
  
  var pattern = /SensorReplaced/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
