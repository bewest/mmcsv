
var should = require('should');
var es = require('event-stream');

describe("utils", function ( ) {
  var utils = require('../lib/utils');

  var invalidInput = { deviceTime: '2014-02-23T13:40:54', value: '' };
  it("piping invalid elements should yield empty", function (done) {
    var input = es.readArray([invalidInput]);
    function testEmpty (err, results) {
      results.should.be.empty;
      done( );
    }
    es.pipeline(input, utils.validate( ), es.writeArray(testEmpty));
  });

  it("details should parse details", function ( ) {
    var raw = '3214,2/9/14,20:45:16,2/9/14 20:45:16,,,,,,,,,,,,,,,5.1,125,106,13,45,64,137,0.2,4.9,0.0,,,,,,BolusWizardBolusEstimate,"BG_INPUT=137, BG_UNITS=mg dl, CARB_INPUT=64, CARB_UNITS=grams, CARB_RATIO=13, INSULIN_SENSITIVITY=45, BG_TARGET_LOW=106, BG_TARGET_HIGH=125, BOLUS_ESTIMATE=5.1, CORRECTION_ESTIMATE=0.2, FOOD_ESTIMATE=4.9, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=0, ACTION_REQUESTOR=pump",12354037351,52963854,110,Paradigm 522';
    var fields = utils.fields(raw);
    fields.length.should.equal(39);
    var values = utils.select(fields, 'Raw-Values');
    values.should.equal('BG_INPUT=137, BG_UNITS=mg dl, CARB_INPUT=64, CARB_UNITS=grams, CARB_RATIO=13, INSULIN_SENSITIVITY=45, BG_TARGET_LOW=106, BG_TARGET_HIGH=125, BOLUS_ESTIMATE=5.1, CORRECTION_ESTIMATE=0.2, FOOD_ESTIMATE=4.9, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=0, ACTION_REQUESTOR=pump');
    var details = utils.details(values);
    var correct = { BG_INPUT: '137',
      BG_UNITS: 'mg dl',
      CARB_INPUT: '64',
      CARB_UNITS: 'grams',
      CARB_RATIO: '13',
      INSULIN_SENSITIVITY: '45',
      BG_TARGET_LOW: '106',
      BG_TARGET_HIGH: '125',
      BOLUS_ESTIMATE: '5.1',
      CORRECTION_ESTIMATE: '0.2',
      FOOD_ESTIMATE: '4.9',
      UNABSORBED_INSULIN_TOTAL: '0',
      UNABSORBED_INSULIN_COUNT: '0',
      ACTION_REQUESTOR: 'pump' };
    details.should.eql(correct);
  });
});
