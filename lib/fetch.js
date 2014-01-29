'use strict';

var request = require('request').defaults({jar: true}),
  moment = require('moment'),
  config = require('../package.json').config,
  common = require('common'),
  es = require('event-stream'),
  parse = require('./parse'),
  fetch;

module.exports = fetch = function () {
  var getCsvOption = function(daysAgo) {
    var m = moment();

    return  {
      qs: {
        t: '11'
      },
      form: {
        report: 11,
        listSeparator: ',',
        datePicker1: m.format('MM/DD/YYYY'),
        datePicker2: m.subtract('days', daysAgo || 14).format('MM/DD/YYYY')
      },
      headers: {
        Host: 'carelink.minimed.com',
        Connection: 'keep-alive',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'en-US,en;q=0.8'
      }
    };
  };
  function Fetch (user, password, daysAgo, callback, raw) {
    var data = [];

    common.step([
      function(next) {
        request.post(config.carelink_security, {qs: {j_username: user, j_password: password}}, next);
      },
      function(response, next) {
        request.get(config.carelink_login, next);
      },
      function(response, next) {
        // first turn the fetched data into an array
        var parsing = parse.all( );
        var generates = request.post(config.carelink_csv, getCsvOption(daysAgo));
        var parsed = es.pipeline(parsing, es.writeArray(done));
        if (raw) {
          es.pipeline(generates, raw, es.writeArray(done));
        } else {
          es.pipeline(generates, parsed);
        }

        function done (err, data) {
          console.log('MMCSV parsed %d records after the fetch', data.length);
          console.log('callback', callback);
          callback(err, data);
        }
      }
    ],
      function(error) {
        callback(error);
    });
  }

  return Fetch;
}();
if (!module.parent) {
  var user = process.argv[2] || process.env['MMCSV_USER']
    , pass = process.argv[3] || process.env['MMCSV_PASS']
    , days = process.argv[4] || process.env['MMCSV_DAYS'] || 10
    , pure = process.env['MMCSV_PARSE'] ? null : true;
    ;
  var tz = (new Date( )).getTimezoneOffset( );
  if (user && pass && days) {
    var out = pure ? process.stdout : null;
    console.log('#', process.argv[1], user, pass, days);
    fetch(user, pass, tz, days, function(err, data) {
      if (!err) {
        console.log("data:", data);
        console.log("data.length:", data.length);
      } else {
        console.log('ERROR', err);
      }
    }, out);


  } else {
    console.log('usage:', process.argv[1], '<user> <password> <days>');
  }
}
