
var fixture = {
  name: 'cbg'
, parser: 'cbg'
, schema: 'cbg'
// XXX: DOES NOT APPEAR?  TODO: need sample
// , input: ''
, proof: function proof (err, results) {
    var result = results.pop( );
    console.log('err', err);
    console.log('result', result.errors);
  }
};
module.exports = fixture;
