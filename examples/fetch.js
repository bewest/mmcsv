var es = require('event-stream');
var fetch = require('../').fetch;

if (!module.parent) {
  var user = process.argv[2] || process.env['MMCSV_USER']
    , pass = process.argv[3] || process.env['MMCSV_PASS']
    , days = process.argv[4] || process.env['MMCSV_DAYS'] || 10
    , pure = process.env['MMCSV_PARSE'] ? null : true;
    ;
  if (user && pass && days) {
    var out = pure ? es.pipeline(es.through( ), process.stdout) : null;
    console.log('#', process.argv[1], user, pass, days);
    fetch(user, pass, days, function(err, data) {
      if (!err) {
        console.log("data:", data);
        console.log("data.length:", data.length);
      } else {
        console.log('ERROR', err);
      }
    }, out);


  } else {
    console.log('usage:', process.argv[1], '<user> <password> <days>');
  }
}

