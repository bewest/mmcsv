'use strict';

var moment = require('moment'),
  config = require('../package.json').config,
  common = require('common'),
  es = require('event-stream'),
  parse = require('./parse'),
  fetch;

module.exports = fetch = function () {
  var request = require('request');
  var poolRequests = { };
  function defaultOptions ( ) {
    return  {
      jar: true,
      pool: poolRequests,
      followRedirect: false,
      headers: {
        Host: 'carelink.minimed.com',
        Connection: 'keep-alive',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36',
        'Accept-Encoding': 'gzip,deflate,sdch',
        'Accept-Language': 'en-US,en;q=0.8'
      }
    }
  }
  request.defaults(defaultOptions( ));
  var jar = request.jar( );
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
      pool: poolRequests,
      followRedirect: false,
      jar: jar,
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

    common.step([
      function doLogin (next) {
        var login = defaultOptions( );
        login.jar = jar;
        login.qs = {j_username: user, j_password: password};
        request.post(config.carelink_security, login, next);
      },
      function doFetchCookie (response, next) {
        var cook = defaultOptions( );
        cook.jar = jar;

        request.get(config.carelink_login, cook, next);
      },
      function doFetchCSV (response, next) {
        // first turn the fetched data into an array
        var parsing = parse.all( );
        var c = getCsvOption(daysAgo);
        var generates = request.post(config.carelink_csv, c);
        var parsed = es.pipeline(parsing, es.writeArray(done));
        if (raw) {
          es.pipeline(generates, raw, es.writeArray(done));
        } else {
          es.pipeline(generates, parsed);
        }

        function done (err, data) {
          // console.log('MMCSV parsed %d records after the fetch', data.length);
          callback(err, data);
        }
      }
    ], function onError (error) {
        if (out) { out.emit('error', error); }
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
  if (user && pass && days) {
    var out = pure ? process.stdout : null;
    console.log('#', process.argv[1], user, pass, days);
    fetch(user, pass, days, function(err, data) {
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
