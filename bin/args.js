var fs = require('fs');
var extend = require('util-extend');

function parse (args) {
  var optimist = require('optimist')
    ;
  var content = fs.readFileSync(__dirname + '/usage.txt').toString( );
  var usage = {
    help: {
      description: "Some more details about mmcsv"
    , required: true
    , alias: 'h' 
    }
  };
  var command = args.slice(0, 1).shift( );
  switch (command) {
    case 'fetch':
      content = fs.readFileSync(__dirname + '/fetch.txt').toString( );
      break;
    case 'parse':
      content = fs.readFileSync(__dirname + '/parse.txt').toString( );
      break;
    default:
      break;
  }
  var config = optimist(args)
      .usage(content, usage)
    ;
  config.$0 = 'mmcsv';
  var opts = config.argv;
  opts.help = config.help;

  opts.command = opts._.shift( );
  if (command == 'fetch') {
    opts.username = opts.username || opts.u || process.env['CARELINK_USERNAME'];
    opts.password = opts.password || opts.p || process.env['CARELINK_PASSWORD'];
    opts.days = opts.days || opts.d;
  }

  return opts;
}

module.exports = parse;
