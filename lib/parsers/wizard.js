module.exports = function configure (utils) {

  function parse (row, callback) {
    var keys = [ 'Timestamp', 'Raw-Values',
                 'Raw-Upload ID', 'Index', 'Raw-Device Type' ];
    var fields = utils.pluck(row, keys);
    var details = utils.details(fields['Raw-Values'] || '');
    var device = fields['Raw-Device Type'];
    var index = parseInt(fields.Index) + 1;
    var key = [ fields['Raw-Upload ID'], index, device ].join(' ');
    var data = {
      value: details.BOLUS_ESTIMATE
    , smbg: details.BG_INPUT
    , carbs: details.CARB_INPUT
    , carb_units: details.CARB_UNITS
    , carb_ratio: details.CARB_RATIO
    , sensitivity: details.INSULIN_SENSITIVITY
    , recommended: details.BOLUS_ESTIMATE
    , correction: details.CORRECTION_ESTIMATE
    , food: details.FOOD_ESTIMATE
    , joinKey: key
    , type: 'wizard'
    , deviceTime: utils.reformatISO(fields.Timestamp)
    };

    return callback(null, data);
  }

  function isValid (data) {
    return (
      !isNaN(data.value)
      && data.type == "wizard"
    );
  }
  var pattern = /BolusWizard/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

