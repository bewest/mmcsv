module.exports = {
	fetch: require('./lib/fetch'),
	parse: require('./lib/parse')
};

if (!module.parent) {
  var es = require('event-stream');
  var mmcsv = require('./lib/parse');
  es.pipeline(
    process.openStdin( )
  , mmcsv.all(new Date( ).getTimezoneOffset( ))
  , es.writeArray(function (err, data) {
      console.log(data);
      console.log("Found", data.length, 'records.');
    })
  );
}
