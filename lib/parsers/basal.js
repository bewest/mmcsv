
module.exports = function configure (utils) {
  function parse (row, callback) {

    var details = utils.details(utils.select(row, 'Raw-Values') || '');
    if (!details.RATE) {
      return callback( );
    }

    var data = {
      scheduleName: details.PATTERN_NAME,
      value: parseFloat(details.RATE),
      type: 'basal-rate-change',
      deliveryType: 'scheduled',
      deviceTime: utils.reformatISO(utils.select(row, 'Timestamp'))
    };
    return callback(null, data);
  }

  function isValid (data) {
    return (!isNaN(data.value) && data.type == 'basal-rate-change');
  }

  var pattern = /BasalProfileStart/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}
