
module.exports = function configure (utils) {
  function parse (row, callback) {

   //'Temp Basal Start':  { bg: true, duration: true,  percent: true,  absolute: true   }
   // , 'Temp Basal End':    { bg: true}
  // Adapted to push in temporary basals
  // Requires careportal plugin in Nightscout
  // Currently just picking out smartguard (PLGM) OR any other reasons for suspend eg battery, reservoir...
  // eventTime: 'hh:mm', 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  // Note Temp Basal event type (not start / end)
  
    var details = utils.pluck(row, ['Suspend', 'Timestamp']);
    var value = details['Suspend'];

	if (value == 'Resume') {
    var data = {
		value: value,
		eventType: 'Temp Basal',
		dateString: utils.reformatISO(details['Timestamp']),
		created_at: utils.reformatCPTime(details['Timestamp']),
		date: utils.reformatDate(details['Timestamp'])
	  }
	}
	  else {
		var data = {
		  value: value,
		  eventType: 'Temp Basal',
		  duration: 120,
		  absolute: 0,
		  enteredBy: 'PLGM',
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
  
  var pattern = /ChangeSuspendState/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
