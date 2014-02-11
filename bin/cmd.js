#!/usr/bin/env node

var tabtab = require('tabtab');
var args = require('./args.js');
var completer = require('./completion');
function main (opts) {
  require('./' + opts.command)(opts);
}

if (!module.parent) {
  var proc = process.argv.slice(2);
  var opts = args(proc);
  if (process.argv[2] == 'completion') {
    return completer(opts);
  }
  if (opts.command && !opts.h) {
    main(opts);
  } else {
    console.log(opts.help( ));
  }
}
