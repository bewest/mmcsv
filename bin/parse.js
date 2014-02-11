var es = require('event-stream');
var fs = require('fs');
var mmcsv = require('../').parse;
function parse (opts) {
  var input;
  opts.input = opts._.pop( );
  if (opts.input == '-' || !process.stdin.isTTY) {
    input = process.stdin;
    input.resume( );
  } else {
    if (!opts.input) {
      console.error(opts.help( ));
      process.exit(1);
    }
    input = fs.createReadStream(opts.input);
  }
  var filter = opts.filter || 'all';
  var parser = mmcsv[filter]( );
  es.pipeline(input, parser, es.writeArray(done));
}
function done (err, data) {
  console.log(data);
}

module.exports = parse;
