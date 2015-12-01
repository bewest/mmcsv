module.exports = function configure (utils) {
	// changed smbg to mbg for NS compatibility
	// changed Devicetime to dateString 
	// added date
		
  function parse (row, callback) {
    var o = utils.pluck(row, ['BG Reading (mg/dL)', 'Timestamp']);
    var value = o['BG Reading (mg/dL)'];
    var data = {
      value: value,
      mbg: parseInt(value),
      type: 'mbg',
	  dateString: utils.reformatISO(o['Timestamp']),
      date: utils.reformatDate(o['Timestamp'])
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