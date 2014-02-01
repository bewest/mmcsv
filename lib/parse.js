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

  var allStream = require('./parsers/all')(stream, all, utils);
  stream.all = allStream;

  stream.responder = responder;

  return stream;
};

var types = ['bolus', 'basal', 'smbg', 'cbg', 'carbs', 'all' ];
types.forEach(function make (key) {
  mmcsv[key] = (function meta ( ) {
    return mmcsv( )[key]( );
  });
});

mmcsv.columns = function() {
  return columns;
};

module.exports = mmcsv;
