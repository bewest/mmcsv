module.exports = function configure (utils) {
	// changed smbg to mbg for NS compatibility
	// changed Devicetime to dateString 
	// added date
	// changed to use BGCapturedOnPump and AMOUNT (this is always mg/dl regardless of CareLink preference setting)
		
  function parse (row, callback) {
    	
    var details = utils.pluck(row, ['Raw-Type', 'Timestamp']);
    var value = details['Raw-Type'];
	var values = utils.details(utils.select(row, 'Raw-Values') || '');
  
	if (value == 'BGCapturedOnPump') {
    var data = {
      value: values.AMOUNT,
      mbg: parseInt(values.AMOUNT),
      type: 'mbg',
	  dateString: utils.reformatISO(details['Timestamp']),
      date: utils.reformatDate(details['Timestamp'])
		}
	};

    return callback(null, data);
  }
  function isValid (data) {
    return data.value || false;
  }

  var pattern = /BGCapturedOnPump/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}