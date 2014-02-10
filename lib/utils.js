
var es = require('event-stream');
var columns = require('./parsers/columns');
var moment = require('moment');

function validator (valid) {
  function each (data, next) {
    if (valid(data)) {
      return next(null, data);
    }
    next( );
  }
  return es.map(each);
}

var CARELINK_TIME = 'MM/DD/YYTHH:mm:ss';
var OUTPUT_TIME_MASK = 'YYYY-MM-DDTHH:mm:ss';
function reformatISO (str) {
  var m = moment(str, CARELINK_TIME);
  return m.format(OUTPUT_TIME_MASK);
}

function validTime (str) {
  return moment(str, OUTPUT_TIME_MASK).isValid( );
}

function times (valid) {
  function withTime (data, next) {
    if (valid(data.deviceTime)) {
      return next(null, data);
    }
    next( );
  }
  return es.map(withTime);
}

function validTimes ( ) {
  return times(validTime);
}

function hasValue (data) {
  return (data.value !== null);
}
function validValues ( ) {
  function iter (data, next) {
    if (hasValue(data)) {
      return next(null, data);
    }
    next( );
  }
  return es.map(iter);
}

function pluck (o, keys) {
  var out = { };
  function prop (el) {
    out[el] = api.select(o, el)
  }
  keys.forEach(prop);
  return out;
}

function splitIntoFields (rawData) {
  var firstDoubleQuote, firstPart, lastDoubleQuote, processFields, secondPart, thirdPart;
  firstDoubleQuote = rawData.indexOf('\"');
  lastDoubleQuote = rawData.lastIndexOf('\"');
  firstPart = rawData.slice(0, firstDoubleQuote - 1);
  secondPart = rawData.slice(firstDoubleQuote + 1, lastDoubleQuote);
  thirdPart = rawData.slice(lastDoubleQuote + 2, rawData.length);
  processFields = firstPart.split(',');
  processFields.push(secondPart);
  processFields = processFields.concat(thirdPart.split(','));
  return processFields;
}

function responder (stream, filter) {
  var tr = es.through( );

  stream.on('type', function(data) {
    if (data.type.match(filter)) {
      return tr.push(data.data);
    }
  });
  return es.pipeline(stream, tr);
}

function split ( ) {
  function iter (data, next) {
    next(null, splitIntoFields(data));
  }
  return es.map(iter);
}

function validate ( ) {
  return es.pipeline(validTimes( ), validValues( ));
}

var api = {
    columns: columns
  , validator: validator
  , select: columns.fetch
  , map: es.map
  , pipeline: es.pipeline
  , validTimes: validTimes
  , reformatISO: reformatISO
  , pluck: pluck
  , split: split
  , validate: validate
  , responder: responder
};
module.exports = api;
