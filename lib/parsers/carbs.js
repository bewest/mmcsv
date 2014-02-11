module.exports = function configure (utils) {

  function parse (row, callback) {
    var detail = utils.select(row, 'Raw-Values');
    if(!detail) {
      return callback( );
    }

    detail = detail.split(',');
    var carbs = detail[2].split('=')[1];
    var data = {
      carbs: parseInt(carbs),
      value: carbs,
      type: 'carbs',
      units: detail[3].split('=')[1],
      deviceTime: utils.reformatISO(utils.select(row, 'Timestamp'))
    };
    return callback(null, data);
  }

  function isValid (data) {
    return (
      !isNaN(data.carbs)  &&
      data.carbs > 0 &&
      !isNaN(data.value) &&
      data.value > 0 &&
      data.units &&
      data.type == 'carbs'
    );
  }

  var pattern = /BolusWizardBolusEstimate/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;
}

