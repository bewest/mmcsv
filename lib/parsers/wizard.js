module.exports = function configure (utils) {

// CarePortal adjustments
// Wizard will handle BG and carb info ONLY
// bolus will handle actual *delivered* insulin
// ie both wizard and bolus need to be called
// eventType = "Correction Bolus", "Meal Bolus", ("Snack Bolus")
// eventTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
// bg, carbs used
// insulin not used here!
// rest are left for info and possible future use


  function parse (row, callback) {
    var keys = [ 'Timestamp', 'Raw-Values',
                 'Raw-Upload ID', 'Index', 'Raw-Device Type' ];
    var fields = utils.pluck(row, keys);
    var details = utils.details(fields['Raw-Values'] || '');
    var device = fields['Raw-Device Type'];
    var index = parseInt(fields.Index) + 1;
    var key = [ fields['Raw-Upload ID'], index, device ].join(' ');
    
	if (details.CARB_INPUT != '') {
		var data = {
		value: details.BOLUS_ESTIMATE
		, bg: details.BG_INPUT
		, carbs: details.CARB_INPUT
		, carb_units: details.CARB_UNITS
		, carb_ratio: details.CARB_RATIO
		, sensitivity: details.INSULIN_SENSITIVITY
		, recommended: details.BOLUS_ESTIMATE
		, correction: details.CORRECTION_ESTIMATE
		, food: details.FOOD_ESTIMATE
		, joinKey: utils.hash(key)
		, type: 'wizard'
		, eventType: 'Meal Bolus'
		, enteredBy: 'CSV'
		, dateString: utils.reformatISO(fields.Timestamp)
		, created_at: utils.reformatCPTime(fields.Timestamp)
		, date: utils.reformatDate(fields.Timestamp)
		}
	};

	return callback(null, data);
  }	
	
  function isValid (data) {
    return (
      !isNaN(data.value)
      && data.type == "wizard"
    );
  }
  // changed pattern from BolusWizard 
  var pattern = /BolusWizardBolusEstimate/g;
  var stream = utils.pipeline(utils.split( ), utils.map(parse), utils.validator(isValid));
  var parser = { pattern: pattern, stream: stream, parse: parse };
  return parser;

}

