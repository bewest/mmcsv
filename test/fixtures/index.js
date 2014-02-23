
var fixtures = [ ];

fixtures.push(require('./basal'));
fixtures.push(require('./bolus'));
fixtures.push(require('./smbg'));
fixtures.push(require('./cbg'));
fixtures.push(require('./bolus-wizard'));
fixtures.push(require('./bolus-wizard'));
fixtures.push(require('./bolus-dual-part-one'));
fixtures.push(require('./bolus-dual-part-two'));
var example = {
  name: 'invalid carbs', parser: 'carbs', schema: 'carbs'
, description: 'should not emit anything'
, input: '19,10/5/13,13:19:44,10/5/13 13:19:44,,,,,,,,,,,,,,,1.6,100,80,12,50,,0,0,1.6,0.0,,,,,,BolusWizardBolusEstimate,"BG_INPUT=0, BG_UNITS=mg dl, CARB_INPUT=, CARB_UNITS=grams, CARB_RATIO=12, INSULIN_SENSITIVITY=50, BG_TARGET_LOW=80, BG_TARGET_HIGH=100, BOLUS_ESTIMATE=1.6, CORRECTION_ESTIMATE=0, FOOD_ESTIMATE=1.6, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=2, ACTION_REQUESTOR=paradigm link or b key",11528764692,AABBCCDD,295,Paradigm Revel - 523'
, proof: function proof (err, results) {
    results.should.be.empty;
  }
};
fixtures.push(example);
module.exports = fixtures;

