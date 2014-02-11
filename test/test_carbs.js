
var should = require('should');
var validators = require('tidepool-data-model');
var es = require('event-stream');

describe('carbs', function ( ) {
  before(function ( ) {
    var mmcsv = require('../lib/parse');
    this.parser = mmcsv.carbs( );
    this.validate = validators({schema: 'carbs'});
  });
  it('stream', function (done) {
    var input = [
      '19,10/5/13,13:19:44,10/5/13 13:19:44,,,,,,,,,,,,,,,1.6,100,80,12,50,20,0,0,1.6,0.0,,,,,,BolusWizardBolusEstimate,"BG_INPUT=0, BG_UNITS=mg dl, CARB_INPUT=20, CARB_UNITS=grams, CARB_RATIO=12, INSULIN_SENSITIVITY=50, BG_TARGET_LOW=80, BG_TARGET_HIGH=100, BOLUS_ESTIMATE=1.6, CORRECTION_ESTIMATE=0, FOOD_ESTIMATE=1.6, UNABSORBED_INSULIN_TOTAL=0, UNABSORBED_INSULIN_COUNT=2, ACTION_REQUESTOR=paradigm link or b key",11528764692,AABBCCDD,295,Paradigm Revel - 523'
    ];
    es.pipeline(es.readArray(input)
      , this.parser, validators.stream(this.validate)
      , es.writeArray(proof))
      ;
    function proof (err, results) {
      var result = results.pop( );
      console.log('err', err);
      console.log('result', result.errors);
      done( );
    }
    
  });

});

