module.exports = function configure (utils) {
	// changed cbg to sgv for NS compatibility
	// changed Devicetime to dateString 
	// added date
	// changed to use GlucoseSensorData and AMOUNT (this is always mg/dl regardless of CareLink preference setting)
  function parse (row, callback) {
	  	   	
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];
	var values = utils.details(utils.select(row, 'Raw-Values') || '');
  
	if (value == 'GlucoseSensorData') {  
    var data = {
      value: values.AMOUNT,
      sgv: parseInt(values.AMOUNT),
      type: 'sgv',
	  dateString: utils.reformatISO(details['Timestamp']),
      date: utils.reformatDate(details['Timestamp'])
		}
	};

    return callback(null, data);
  }
  function isValid (data) {
    return data.value || false;
  }

  var pattern = /GlucoseSensorData|BGLifeScan|BGTherasense/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}
