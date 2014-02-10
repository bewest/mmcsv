var fs = require('fs');

function parse (args) {
  var optimist = require('optimist')
    ;
  var content = fs.readFileSync(__dirname + '/usage.txt').toString( );
  var usage = {
    help: {
      description: "Some more details about mmcsv"
    , required: true
    , short: 'h' 
    }
  };
  // var main = args.shift( );
  var config = optimist(args)
      .usage(content, usage)
    ;
  config.$0 = 'mmcsv';
  var opts = config.argv;
  opts.help = config.help;

  opts.command = opts._.shift( );
  var sub;
  switch (opts.command) {
    case 'fetch':
      sub = require('./fetch')(config);
      break;
    case 'parse':
      sub = require('./parse')(config);
      break;
    default:
      break;
  }
  opts.main = sub;
  /*
  if (!opts.command || opts.command == 'help') {
    config.showHelp( );
    process.exit(0);
  }
  */
  return opts;
}

module.exports = parse;
