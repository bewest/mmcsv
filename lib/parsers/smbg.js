
module.exports = function configure (utils) {

  function parse (row, callback) {
    var bg = utils.select(row, 'BG Reading (mg/dL)');
    if (isNaN(parseFloat(bg))) {
      bg = utils.select(row, 'Sensor Calibration BG (mg/dL)');
    }

    if (bg) {

      var data = {
        value: bg,
        type: 'smbg',
        deviceTime: utils.reformatISO(utils.select(row, 'Timestamp'))
      };
      return callback(null, data);
    }
    return callback( );

  }

  function isValid (data) {
    return (data && !isNaN(data.value) && data.value > 0 && data.type == 'smbg');
  }

  var pattern =  /BGBayer|BGReceived|CalBGForPH/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

