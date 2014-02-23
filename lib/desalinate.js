'use strict';

var es    = require('event-stream')
  , mmcsv = require('./parse')
  ;

function writer (json) {
  switch (json.type) {
    case 'carbs':
    case 'cbg':
    case 'smbg':
      this.queue(json);
      break;
    default:
      break;
  }
}

function config ( ) {
 var out = es.through(writer);
 var stream = es.pipeline(mmcsv.all( ), out);
 return stream;
}

module.exports = config;
