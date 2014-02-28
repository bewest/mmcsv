
var fixture = {
  name: 'basal'
, parser: 'basal'
, schema: 'basal'
, input: '3,10/5/13,02:00:00,10/5/13 02:00:00,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,BasalProfileStart,"PATTERN_NAME=standard, PROFILE_INDEX=1, RATE=0.65, START_TIME=7200000, ACTION_REQUESTOR=pump",11528764709,AABBCCDD,312,Paradigm Revel - 523'
, proof: function proof (err, results) {
    var result = results.pop( );
    var inst = result.instance;
    var correct = {
      scheduleName: 'standard',
      value: 0.65,
      type: 'basal-rate-change',
      deliveryType: 'scheduled',
      deviceTime: '2013-10-05T02:00:00'
    };

    inst.should.eql(correct);

    result.errors.should.be.empty;
  }
};
module.exports = fixture;
