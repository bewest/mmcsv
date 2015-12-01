
var es = require('event-stream');
// explicitly require each parser module, for the benefit of tools like
// browserify
// Added plgm (predicted low glucose management, Smartguard)
// Added basal_temp_percent
// Added basal_temp_absolute
// Added insulin (change)
// Added sensor_start
// Added battery (pump battery)
// Added medpredict (Medtronic Predicted Value + 30 mins)
// Added pump_alarms

var parsers = {
    smbg: require('./smbg')
  , cbg: require('./cbg')
  , bolus: require('./bolus')
  , carbs: require('./carbs')
  , basal: require('./basal')
  , wizard: require('./wizard')
  , plgm: require('./plgm')
  , basal_temp_percent: require('./basal_temp_percent')
  , basal_temp_absolute: require('./basal_temp_absolute')
  , insulin: require('./insulin')
  , sensor_start: require('./sensor_start')
  , battery: require('./battery')
  , medpredict: require('./medpredict')
  , pump_alarms: require('./pump_alarms')
};

var TYPES = ['smbg', 'cbg', 'bolus', 'carbs', 'basal', 'wizard', 'plgm', 'basal_temp_percent', 'basal_temp_absolute', 'insulin', 'sensor_start', 'battery','medpredict', 'pump_alarms'];
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

