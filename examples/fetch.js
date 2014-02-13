var es = require('event-stream');
var mmcsv = require('../');

if (!module.parent) {
  var user = process.argv[2] || process.env['MMCSV_USER']
    , pass = process.argv[3] || process.env['MMCSV_PASS']
    , days = process.argv[4] || process.env['MMCSV_DAYS'] || 10
    , pure = process.env['MMCSV_PARSE'] ? null : true;
    ;
  if (user && pass && days) {
    var opts = { username: user, password: pass, days: days, json: !pure };
    var out = es.through( );
    console.log('#', process.argv[1], user, days);
    var stream = mmcsv.fetch(opts);
    if (opts.json) {
      stream = es.pipeline(stream, mmcsv.parse.all( ), es.stringify( ));
    }
    es.pipeline(stream, out).pipe(process.stdout);

  } else {
    console.log('usage:', process.argv[1], '<user> <password> <days>');
  }
}

