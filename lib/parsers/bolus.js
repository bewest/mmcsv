module.exports = function configure (utils) {
  function exists (d) { return d; }
  function lower (d) { return d.toLowerCase( ); }

  function parse (row, callback) {
    var keys = [ 'Bolus Type', 'Timestamp', 'Raw-Values' ];
    var fields = utils.pluck(row, keys);
    var type = [ 'bolus', fields['Bolus Type'] ]
               .filter(exists).map(lower).join('-');
    var details = utils.details(fields['Raw-Values'] || '');
    var delivered = details.AMOUNT;
    var programmed = details.PROGRAMMED_AMOUNT;
    var duration = details.DURATION;
    var data = {
      value: delivered,
      bolus: parseFloat(delivered),
      programmed: parseFloat(programmed),
      type: type,
      deviceTime: utils.reformatISO(fields.Timestamp)
    };
    if (duration) {
      data.duration = duration;
    }

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

