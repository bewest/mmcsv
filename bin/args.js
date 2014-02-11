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
  // var main = args.shift( );
  switch (command) {
    case 'fetch':
      content = fs.readFileSync(__dirname + '/fetch.txt').toString( );
    case 'parse':
      content = fs.readFileSync(__dirname + '/parse.txt').toString( );
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

  /*
  var sub = false;
  switch (opts.command) {
    case 'fetch':
      // sub = require('./fetch').opts;
      content = fs.readFileSync(__dirname + '/fetch.txt').toString( );
      // config.usage(content);
      opts = extend(opts, optimist(opts._).usage(content).argv);
      break;
    case 'parse':
      // sub = require('./parse').opts;
      break;
    default:
      break;
  }
  if (sub) {
    // sub.parse
    
  }
  opts.main = sub;
  */
  /*
  if (!opts.command || opts.command == 'help') {
    config.showHelp( );
    process.exit(0);
  }
  */
  return opts;
}

module.exports = parse;
