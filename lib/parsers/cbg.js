module.exports = function configure (utils) {
  function parse (row, callback) {
    var o = utils.pluck(row, ['Sensor Glucose (mg/dL)', 'Timestamp']);
    var value = o['Sensor Glucose (mg/dL)'];
    var data = {
      value: value,
      cbg: parseInt(value),
      type: 'cbg',
      deviceTime: utils.reformatISO(o['Timestamp'])
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
