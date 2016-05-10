
var es = require('event-stream');
var moment = require('moment');
var crypto = require('crypto');
var columns = require('./parsers/columns');

function validator (valid) {
  function each (data, next) {
    if (valid(data)) {
      return next(null, data);
    }
    next( );
  }
  return es.map(each);
}
// changed date format from MM/DD/YYTHH:mm:ss
var CARELINK_TIME = 'DD/MM/YYTHH:mm:ss';
var OUTPUT_TIME_MASK = 'YYYY-MM-DDTHH:mm:ss';

//Added for Careportal in NS
var OUTPUT_CAREPORTAL_TIME = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
var OUTPUT_CAREPORTAL_DATE = 'YYYY-MM-DD';

function reformatISO (str) {
 var m = moment(str, CARELINK_TIME);
 return m.format(OUTPUT_TIME_MASK);
}

// added reformatDate fn
function reformatDate (str) {
	var m = moment(str, CARELINK_TIME);
	return m.valueOf();
}

// added reformatCPDate fn
function reformatCPDate (str) {
	var m = moment(str, CARELINK_TIME);
 return m.format(OUTPUT_CAREPORTAL_DATE);
}

// added reformatCPTime fn
function reformatCPTime (str) {
 var m = moment(str, CARELINK_TIME);
 return m.format(OUTPUT_CAREPORTAL_TIME);
}

// added reformatCL fn
function reformatCL (str) {
	var m = moment(str);
 return m.format(CARELINK_TIME);
}

function validTime (str) {
  return moment(str, OUTPUT_TIME_MASK).isValid( );
}

// changed from dateString to date 
function times (valid) {
  function withTime (data, next) {
    if (valid(data.dateString)) {
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
  return !(data.value === "" || data.value === null);
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

/**
 * Return a hashed version of a string.
 */
function hash (input) {
  var hash = crypto.createHash('sha1').update(input);
  return hash.digest('hex').slice(0, 10);

}
/**
 * One of the CSV columns, Raw-Values includes all the information anyone
 * really needs.  It has it's own kind of funny format, this function turns
 * that field into an object.
 */
function details (raw) {
  var obj = { };
  raw.split(', ').forEach(function make (elem) {
    var pair = elem.split('=');
    obj[pair[0]] = pair[1];
  });
  return obj;
}

function validate ( ) {
  return es.pipeline(validTimes( ), validValues( ));
}

// Added reformatDate, reformatCPDate, reformatCPTime, reformatCL below
var api = {
    columns: columns
  , validator: validator
  , select: columns.fetch
  , map: es.map
  , pipeline: es.pipeline
  , validTimes: validTimes
  , reformatISO: reformatISO
  , reformatDate: reformatDate
  , reformatCPDate: reformatCPDate
  , reformatCPTime: reformatCPTime
  , reformatCL: reformatCL
  , pluck: pluck
  , split: split
  , fields: splitIntoFields
  , hash: hash 
  , details: details
  , validate: validate
  , responder: responder
};
module.exports = api;
