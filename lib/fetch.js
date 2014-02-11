'use strict';

var moment = require('moment'),
  config = require('../package.json').config,
  common = require('common'),
  es = require('event-stream'),
  parse = require('./parse'),
  fetch;

module.exports = fetch = (function exec ( ) {
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
  function Fetch (opts) {
    var user = opts.username;
    var password = opts.password;
    var daysAgo = opts.days;
    var out = es.through( );
    var callback = opts.callback || (function empty ( ) { });

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
        var c = getCsvOption(daysAgo);
        var generates = request.post(config.carelink_csv, c);
        es.pipeline(generates, out);

      }
    ], function onError (error) {
        if (out) { out.emit('error', error); }
        callback(error);
    });
    return out;
  }

  return Fetch;
})();
