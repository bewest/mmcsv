
var es = require('event-stream');
// explicitly require each parser module, for the benefit of tools like
// browserify
var parsers = {
    smbg: require('./smbg')
  , cbg: require('./cbg')
  , bolus: require('./bolus')
  , carbs: require('./carbs')
  , basal: require('./basal')
};

var TYPES = ['smbg', 'cbg', 'bolus', 'carbs', 'basal' ];
function init ( ) {
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
  return stream;
}

function dispatchers (utils) {
  var dispatched = { };
  TYPES.forEach(function make (key) {
    dispatched[key] = parsers[key](utils);
  });

  return dispatched;
}

function install (stream, utils) {
  var all = [ ];
  var dispatched = dispatchers(utils);
  var keys = Object.keys(dispatched);
  function mint (key) {
    var handle = dispatched[key];
    all.push(handle);
    function create (opts) {
      var pipe = es.pipeline(utils.responder(stream, handle.pattern), handle.stream, utils.validate( ));
      return pipe;
    }
    stream[key] = create;
    return create;
  }
  keys.forEach(mint);

  var allStream = require('./all')(stream, all, utils);
  stream.all = allStream;
  return dispatched;
}

function create (utils) {
  var stream = init( );
  install(stream, utils);
  return stream;
}

create.install = install;
create.dispatchers = dispatchers;
create.init = init;
create.types = TYPES;
create.parsers = parsers;

module.exports = create;

