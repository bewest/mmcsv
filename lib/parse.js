'use strict';

var es    = require('event-stream'),
  utils   = require('./utils'),
  parsers = require('./parsers/')
  ;

function mmcsv ( ) {

  var stream = parsers(utils);
  return stream;

}

var types = parsers.types.concat([ 'all' ]);
types.forEach(function make (key) {
  mmcsv[key] = (function meta ( ) {
    return mmcsv( )[key]( );
  });
});

module.exports = mmcsv;
