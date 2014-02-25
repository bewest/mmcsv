'use strict';

var es    = require('event-stream')
  , mmcsv = require('./parse')
  , crypto = require('crypto')
  ;

function writer (json) {
  switch (json.type) {
    case 'carbs':
    case 'cbg':
    case 'smbg':
    case 'wizard':
    case 'bolus':
    case 'basal-rate-change':
      if (json.joinKey) {
        var hash = crypto.createHash('sha1').update(json.joinKey);
        json.joinKey = hash.digest('hex');
        
      }
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
