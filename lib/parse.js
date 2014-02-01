'use strict';

var es = require('event-stream'),
 utils = require('./utils');

var mmcsv = function() {

  var responder = function(filter) {
    var tr = es.through();

    stream.on('type', function(data) {
      if (data.type.match(filter)) {
        return tr.push(data.data);
      }
    });
    return es.pipeline(stream, tr);
  };

  var dispatched = {
      smbg: require('./parsers/smbg')(utils)
    , cbg: require('./parsers/cbg')(utils)
    , bolus: require('./parsers/bolus')(utils)
    , carbs: require('./parsers/carbs')(utils)
    , basal: require('./parsers/basal')(utils)
  };

  var stream = es.pipeline(es.split(), es.map(iter));
  function iter (data, callback) {
    var fields = data.split(',');

    if (fields.length < 36) {
      return callback(null, data);
    } else {
      stream.emit('type', {type: fields[33], data: data});
      return callback();
    }
  }

  var all = [ ];
  var _all = es.through( );
  var keys = Object.keys(dispatched);
  function mint (key) {
    var handle = dispatched[key];
    all.push(handle);
    function create (opts) {
      var pipe = es.pipeline(responder(handle.pattern), handle.stream, utils.validate( ));
      return pipe;
    }
    stream[key] = create;
    return create;
  }
  keys.forEach(mint);

  function createAll ( ) {
    var out = es.through( );
    var incoming = es.through( );
    // var raw = es.pipeline(incoming, responder(/.*/g));
    function tap (tapped) {
      return tapped.stream;
      // .pipe(tapped.stream).pipe(out, {end: false});

      // incoming.on('data', sub.write);
    }
    var origin = responder(/.*/g);

    return es.pipeline(origin, incoming);
    es.map(function dispatch (item, next) {
      var start = es.readArray(all);
      function inspect (handle, cb) {
        if (item.match(handle.pattern)) {
          return cb(null, handle);
        }
        cb( );
      }
      function done (err, results) {
        var s = results.pop( );
        if (!s) {
          return next( );
        }
        s.parse( );
        
      }
    });
    // all.forEach(tap);
    // return es.duplex(incoming, out);
  }
  stream.all = createAll;
  /*
  stream.all = function( ) {
    return es.pipeline(responder(patterns.all), es.map(function(raw, callback) {
      if (raw.match(patterns.smbg)) {
        parsers.smbg(raw, callback);
      }
      else if (raw.match(patterns.cbg)) {
        parsers.cbg(raw, callback);
      }
      else if (raw.match(patterns.bolus)) {
        parsers.bolus(raw, callback);
      }
      else if (raw.match(patterns.basal)) {
        parsers.basal(raw, callback);
      }
      else if (raw.match(patterns.carbs)) {
        parsers.carbs(raw, callback);
      }
      else callback();
    }));
  };
  */

  stream.responder = responder;

  return stream;
};

mmcsv.bolus = function( ) {
  return mmcsv().bolus( );
};

mmcsv.basal = function( ) {
  return mmcsv().basal( );
};

mmcsv.smbg = function( ) {
  return mmcsv().smbg( );
};

mmcsv.cbg = function( ) {
  return mmcsv().cbg( );
};

mmcsv.carbs = function( ) {
  return mmcsv().carbs( );
};

mmcsv.all = function( ) {
  return mmcsv().all( );
};

mmcsv.columns = function() {
  return columns;
};

module.exports = mmcsv;
