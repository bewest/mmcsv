module.exports = function configure (utils) {
  function exists (d) { return d; }
  function lower (d) { return d.toLowerCase( ); }

  function parse (row, callback) {
    var keys = [ 'Bolus Volume Selected (U)', 'Bolus Volume Delivered (U)',
                 'Bolus Type', 'Timestamp' ];
    var pluck = utils.pluck(row, keys);
    var value = pluck['Bolus Volume Selected (U)'];
    var delivered = pluck['Bolus Volume Delivered (U)'];
    var type = [ 'bolus', pluck['Bolus Type'] ]
               .filter(exists).map(lower).join('-');

    var data = {
      value: value,
      bolus: parseFloat(delivered),
      type: type,
      deviceTime: utils.reformatISO(pluck['Timestamp'])
    };

    return callback(null, data);
  }

  function isValid (data) {
    return (
      !isNaN(data.value)
      && /^bolus-?/g.test(data.type)
    );
  }
  var pattern = /BolusNormal|BolusSquare/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

