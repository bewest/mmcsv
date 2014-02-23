
var fixture = {
  name: 'bolus-dual-part-two'
, parser: 'bolus'
, schema: 'bolus'
, description: 'second part of dual wave bolus'
// , input: '2770,1/25/14,23:35:12,1/25/14 23:35:12,,,,,,,Dual/Normal,3.6,3.6,,,,,,,,,,,,,,,,,,,,,BolusNormal,"AMOUNT=3.6, CONCENTRATION=null, PROGRAMMED_AMOUNT=3.6, ACTION_REQUESTOR=pump, ENABLE=true, IS_DUAL_COMPONENT=true, UNABSORBED_INSULIN_TOTAL=null",12354037665,52963854,424,Paradigm 522'
, input: '2771,1/25/14,23:37:34,1/25/14 23:37:34,,,,,,,Dual/Square,2.3,1.7,01:00:00,,,,,,,,,,,,,,,,,,,,BolusSquare,"AMOUNT=1.7, CONCENTRATION=null, PROGRAMMED_AMOUNT=2.3, ACTION_REQUESTOR=pump, DURATION=3600000, IS_DUAL_COMPONENT=true, UNABSORBED_INSULIN_TOTAL=null",12354037660,52963854,419,Paradigm 522'
, proof: function proof (err, results) {
    var result = results.pop( );
    var inst = result.instance;
    inst.should.be.ok;
    // inst.value.should.equal('1.7');
    // inst.bolus.should.equal('2.3');
    // inst.duration.should.equal('3600000');
    inst.type.should.equal('bolus-dual/square');
    // console.log(result);
    // result.errors.should.be.empty;
  }
};
module.exports = fixture;
