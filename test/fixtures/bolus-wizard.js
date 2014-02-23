
var fixture = {
  name: 'bolus-wizard'
, parser: 'bolus'
, schema: 'bolus'
, description: 'bolus wizard records are diffferent from bolus'
, input: '3214,2/9/14,20:45:16,2/9/14 20:45:16,,,,,,,,,,,,,,,5.1,125,106,13,45,64,137,0.2,4.9,0.0,,,,,,BolusWizardBolusEstimate,"BG_INPUT=137, BG_UNITS=mg dl, CARB_INPUT=64, CARB_UNITS=grams, CARB_RATIO=13, INSULIN_SENSITIVITY=45, BG_TARGET_LOW=106, BG_TARGET_HIGH=125, BOLUS_ESTIMATE=5.1, CORRECTION_ESTIMATE=0.2, FOOD_ESTIMATE=4.9, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=0, ACTION_REQUESTOR=pump",12354037351,52963854,110,Paradigm 522'
, proof: function proof (err, results) {
    // console.log(results);
    // results.length.should.equal(0);
  }
};
module.exports = fixture;
