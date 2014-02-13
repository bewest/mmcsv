
var fixture = {
  name: 'cbg'
, parser: 'cbg'
, schema: 'cbg'
// XXX: DOES NOT APPEAR?  TODO: need sample
, input: '2,12/15/10,00:04:00,12/15/10 00:04:00,,,,,,,,,,,,,,,,,,,,,,,,,,,120,16.54,,GlucoseSensorData,"AMOUNT=120, ISIG=16.54, VCNTR=null, BACKFILL_INDICATOR=null",5472689886,50184670,4240,Paradigm 522'
, proof: function proof (err, results) {
    var result = results.pop( );
    result.errors.should.be.empty;
  }
};
module.exports = fixture;
