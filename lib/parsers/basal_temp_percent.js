
module.exports = function configure (utils) {
  function parse (row, callback) {

  //'Temp Basal Start':  { bg: true, duration: true,  percent: true,  absolute: true   }
  // 'Temp Basal End':    { bg: true}
  // Adapted to push in temporary basals
  // Requires careportal plugin in Nightscout
  // Currently just picking out manual temp basals, not smartguard (PLGM) - see plgm.js
  // eventTime: 'hh:mm', 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  // Medtronic % change is % of original ie 0% = 0units, 150% = 1.5 units / hr on 1.0 unit/hr basal
  // Nightscout % change is % change ie 0% = 1unit/hr (no change), -100% = 0 units/hr; convert from Medtronic to NS by -100
  // Note Temp Basal event type (not start / end)
  // Raw Values are ChangeProgrammedTempBasalPercent at start / on
  // Raw Values are ChangeTempBasalPercent at off /cancelation
  // Percent change only in this script
  
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];

	var values = utils.details(utils.select(row, 'Raw-Values') || '');
    
	if (value == 'ChangeProgrammedTempBasalPercent') {
    var data = {
		value: value,
		eventType: 'Temp Basal',
		duration: parseInt((values.DURATION)/(60.*1000.)),
		percent: parseInt(values.PERCENT_OF_RATE - 100),
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
  
  var pattern = /ChangeProgrammedTempBasalPercent|ChangeTempBasalPercent/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}
