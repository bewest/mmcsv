
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Flag all pump alarms on NS (this will need some way of selecting out what the user wants...)
  // Requires careportal plugin in Nightscout
  // eventTime: 'hh:mm', 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    
    var details = utils.pluck(row, ['Alarm', 'Timestamp']);
    var value = details['Alarm'];

    var data = {
		value: value,
		eventType: 'Announcement',
		enteredBy: 'CSV',
		notes: value,
		dateString: utils.reformatISO(details['Timestamp']),
		created_at: utils.reformatCPTime(details['Timestamp']),
		date: utils.reformatDate(details['Timestamp'])
	  };
	
    return callback(null, data);
  }

  function isValid (data) {
    return data.value || false;
  }
  
  var pattern = /AlarmPumpNGP/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
