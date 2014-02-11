module.exports = function configure (utils) {

  function parse (row, callback) {
    var keys = [ 'Bolus Volume Selected (U)', 'Bolus Volume Delivered (U)',
                 'Bolus Type', 'Timestamp' ];
    var pluck = utils.pluck(row, keys);
    var value = pluck['Bolus Volume Selected (U)'];
    var delivered = pluck['Bolus Volume Delivered (U)'];
    var type = pluck['Bolus Type'];

    var data = {
      value: value,
      bolus: parseFloat(value),
      bolus_delivered: delivered,
      bolus_type: type,
      type: 'bolus',
      deviceTime: utils.reformatISO(pluck['Timestamp'])
    };

    return callback(null, data);
  }

  function isValid (data) {
    return (
      !isNaN(data.value)
      && data.value > 0
      && data.type == 'bolus'
    );
  }
  var pattern = /BolusNormal|BolusSquare/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

