module.exports = function configure (utils) {
  function exists (d) { return d; }
  function lower (d) { return d.toLowerCase( ); }

  function parse (row, callback) {
    var keys = [ 'Bolus Type', 'Timestamp', 'Raw-Values',
                 'Raw-Upload ID', 'Index', 'Raw-Device Type' ];
    var fields = utils.pluck(row, keys);
    var index = fields.Index;
    var device = fields['Raw-Device Type'];
    var details = utils.details(fields['Raw-Values'] || '');
    var delivered = details.AMOUNT;
    var programmed = details.PROGRAMMED_AMOUNT;
    var duration = details.DURATION;
    var data = {
      value: delivered,
      bolus: parseFloat(delivered),
      programmed: parseFloat(programmed),
      type: 'bolus',
      subType: lower(fields['Bolus Type'] || ''),
      deviceTime: utils.reformatISO(fields.Timestamp)
    };
    if (duration) {
      data.duration = duration;
    }
    if (details.IS_DUAL_COMPONENT === 'true') {
      if (data.subType == 'dual/square') {
        index--;
      }
      data.joinKey = [ fields['Raw-Upload ID'], index, device ].join(' ');
    }

    return callback(null, data);
  }

  function isValid (data) {
    return (!isNaN(data.value) && data.type === 'bolus' && data.subType !== '');
  }
  var pattern = /BolusNormal|BolusSquare/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

