
var fixture = {
  name: 'bolus-dual-part-one'
, parser: 'bolus'
, schema: 'bolus'
, description: 'part one of dual wave'
, input: '2770,1/25/14,23:35:12,1/25/14 23:35:12,,,,,,,Dual/Normal,3.6,3.6,,,,,,,,,,,,,,,,,,,,,BolusNormal,"AMOUNT=3.6, CONCENTRATION=null, PROGRAMMED_AMOUNT=3.6, ACTION_REQUESTOR=pump, ENABLE=true, IS_DUAL_COMPONENT=true, UNABSORBED_INSULIN_TOTAL=null",12354037665,52963854,424,Paradigm 522'
  // '2771,1/25/14,23:37:34,1/25/14 23:37:34,,,,,,,Dual/Square,2.3,1.7,01:00:00,,,,,,,,,,,,,,,,,,,,BolusSquare,"AMOUNT=1.7, CONCENTRATION=null, PROGRAMMED_AMOUNT=2.3, ACTION_REQUESTOR=pump, DURATION=3600000, IS_DUAL_COMPONENT=true, UNABSORBED_INSULIN_TOTAL=null",12354037660,52963854,419,Paradigm 522'
, proof: function proof (err, results) {
    var result = results.pop( );
    var inst = result.instance;
    var correct = {
      value: '3.6',
      bolus: 3.6,
      programmed: 3.6,
      type: 'bolus',
      joinKey: 'b69c1acba7',
      subType: 'dual/normal',
      deviceTime: '2014-01-25T23:35:12'
    };
    inst.should.eql(correct);
    // XXX.bewest-2013-02: re-enable once data-model updated
    // result.errors.should.be.empty;
  }
};
module.exports = fixture;
