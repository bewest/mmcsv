
var fixture = {
  name: 'smbg'
, parser: 'smbg'
, schema: 'smbg'
, input: '126,10/5/13,21:03:51,10/5/13 21:03:51,,,,,,,,,,,,,,,,,,,,,,,,,,90,,,,CalBGForPH,"AMOUNT=90, ACTION_REQUESTOR=paradigm link or b key",11528764587,AABBCCDD,190,Paradigm Revel - 523'
, proof: function proof (err, results) {
    var result = results.pop( );
    console.log('err', err);
    console.log('result', result.errors);
  }
};
module.exports = fixture;
