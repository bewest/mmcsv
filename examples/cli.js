
if (!module.parent) {
  var es = require('event-stream');
  var mmcsv = require('../').parse;
  es.pipeline(
    process.openStdin( )
  , mmcsv.all( )
  , es.writeArray(function done (err, data) {
      console.log(data);
      console.log("Found", data.length, 'records.');
    })
  );
}
