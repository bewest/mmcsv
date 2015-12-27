
module.exports = function configure (utils) {
  function parse (row, callback) {

  // Logs change of insulin
  // Requires careportal plugin in Nightscout
  
  // eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    
    var details = utils.pluck(row, ['Prime Type', 'Timestamp']);
    var value = details['Prime Type'];

	if (value == 'Fill Cannula') {
		var data = {
			value: value,
			eventType: 'Site Change',
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
