module.exports = function configure (utils) {
	// changed cbg to sgv for NS compatibility
	// changed Devicetime to dateString 
	// added date
  function parse (row, callback) {
    var o = utils.pluck(row, ['Sensor Glucose (mg/dL)', 'Timestamp']);
    var value = o['Sensor Glucose (mg/dL)'];
    var data = {
      value: value,
      sgv: parseInt(value),
      type: 'sgv',
	  dateString: utils.reformatISO(o['Timestamp']),
      date: utils.reformatDate(o['Timestamp'])
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
