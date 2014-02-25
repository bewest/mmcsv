
var fixture = {
  name: 'bolus-wizard'
, parser: 'wizard'
, schema: 'medtronic/wizard'
, description: 'bolus wizard records'
, input: '3214,2/9/14,20:45:16,2/9/14 20:45:16,,,,,,,,,,,,,,,5.1,125,106,13,45,64,137,0.2,4.9,0.0,,,,,,BolusWizardBolusEstimate,"BG_INPUT=137, BG_UNITS=mg dl, CARB_INPUT=64, CARB_UNITS=grams, CARB_RATIO=13, INSULIN_SENSITIVITY=45, BG_TARGET_LOW=106, BG_TARGET_HIGH=125, BOLUS_ESTIMATE=5.1, CORRECTION_ESTIMATE=0.2, FOOD_ESTIMATE=4.9, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=0, ACTION_REQUESTOR=pump",12354037351,52963854,110,Paradigm 522'
, proof: function proof (err, results) {
    var result = results.pop( );
    var inst = result.instance;
    var correct = {
      "value": "5.1",
      "smbg": "137",
      "carbs": "64",
      "carb_units": "grams",
      "carb_ratio": "13",
      "sensitivity": "45",
      "recommended": "5.1",
      "joinKey": "2640d8c3c0",
      "correction": "0.2",
      "food": "4.9",
      "type": "wizard",
      "deviceTime": "2014-02-09T20:45:16"
    };
    inst.should.eql(correct);
    // XXX.bewest-2013-02: re-enable once data-model updated
    // result.errors.length.should.equal(0);
  }
};
module.exports = fixture;
