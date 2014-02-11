var es = require('event-stream');
function fetch (opts) {
  var mmcsv = require('../');
  var out = es.through( );
  if (!opts.username || !opts.password || !opts.days) {
    if (!opts.username) {
      console.error('Missing --username');
    }
    if (!opts.password) {
      console.error('Missing --password');
    }
    if (isNaN(opts.days)) {
      console.error('Set --days to the number of days to fetch');
    }
    console.error(opts.help( ));
    process.exit(1);
  }
  if (opts.json) {
    out = es.pipeline(out, mmcsv.parse.all( ), es.stringify( ));
  }
  var stream = es.pipeline(mmcsv.fetch(opts), out);
  stream.pipe(process.stdout);

}
module.exports = fetch;
