
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Dummy - Not used at the mo...
  
  // eventTime: 'hh:mm', 'YYYY-MM-DDTHH:mm:sssZ'
    
    var details = utils.pluck(row, ['Prime Type', 'Timestamp']);
    var value = details['Prime Type'];

	if (value == 'Fill Canula') {
		var data = {
			value: value,
			eventType: 'Insulin Change',
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
  
  var pattern = /Prime/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
