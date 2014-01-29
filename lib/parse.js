'use strict';

var es = require('event-stream'),
  moment = require('moment'),
  TidepoolDateTime = require('sundial'),
  tidepoolDateTime = new TidepoolDateTime();

var columns = require('./parsers/columns');

var DATE_TIME_MASK = 'MM/DD/YYTHH:mm:ss';

var display = 'YYYY-MM-DDTHH:mm:ss';
function reformatISO (str) {
  var m = moment(str, DATE_TIME_MASK);
  return m.format(display);
}

function timestamped (ts) {
  moment(ts).isValid( );

}

var parsers = {
  smbg : function(raw, callback) {
    var values = mmcsv.splitIntoFields(raw);
 
    var bg = values[columns['BG Reading (mg/dL)']];
   
    if(isNaN(parseFloat(bg))){
      bg = values[columns['Sensor Calibration BG (mg/dL)']];
    }      

    if(bg){

      var data = {
        value: bg,
        type: 'smbg',
        time: reformatISO(values[columns['Timestamp']])
      };
      return callback(null, data);
    }
    return callback();

  },
  validateSmbg : function(data) {
    return (data &&
      !isNaN(data.value) && data.value > 0 && data.type == 'smbg' && tidepoolDateTime.isValidDateTime(data.time));
  },
  cbg : function(raw, callback) {
    var values = mmcsv.splitIntoFields(raw);

    if (!values[columns['Sensor Glucose (mg/dL)']]) {
      return callback();
    }

    if(!tidepoolDateTime.isValidDateTime(values[columns['Timestamp']])) {
      return callback();
    }

    var data = {
      value: values[columns['Sensor Glucose (mg/dL)']],
      type: 'cbg',
      time: reformatISO(values[columns['Timestamp']])
    };

    return callback(null, data);
  },
  bolus: function(raw, callback) {
    var values = mmcsv.splitIntoFields(raw);

    var data = {
      value: values[columns['Bolus Volume Selected (U)']],
      bolus: values[columns['Bolus Volume Selected (U)']],
      bolus_delivered: values[columns['Bolus Volume Delivered (U)']],
      bolus_type: values[columns['Bolus Type']],
      type: 'bolus',
      time: reformatISO(values[columns['Timestamp']])
    };

    if(parsers.validateBolus(data)){
      return callback(null, data);
    }

    return callback();
  },
  validateBolus : function(data) {
    return (
      !isNaN(data.value)
      && data.value > 0
      && data.type == 'bolus'
      && tidepoolDateTime.isValidDateTime(data.time));
  },
  basal: function(raw, callback) {
    var values = mmcsv.splitIntoFields(raw);

    if (values[columns['Raw-Values']]) {
      var rawValue = values[columns['Raw-Values']].split(',');

      var data = {
        basal: rawValue[2].split('=')[1],
        basal_type: rawValue[0].split('=')[1],
        value: rawValue[2].split('=')[1],
        type: 'basal',
        start: rawValue[3].split('=')[1],
        time: reformatISO(values[columns['Timestamp']])
      };

      if(parsers.validateBasal(data)){
        return callback(null, data);
      }
    }

    return callback();
  },
  validateBasal : function(data) {
    return (
      !isNaN(data.basal)
      && data.basal > 0
      && !isNaN(data.value)
      && data.value > 0
      && data.start
      && data.basal_type
      && data.type == 'basal'
      && tidepoolDateTime.isValidDateTime(data.time));
  },
  carbs: function(raw, callback) {
    var values = mmcsv.splitIntoFields(raw);

    if(values[columns['Raw-Values']]){

      var rawCarbDetail = values[columns['Raw-Values']].split(',');

      var data = {
        carbs: rawCarbDetail[2].split('=')[1],
        value: rawCarbDetail[2].split('=')[1],
        type: 'carbs',
        units: rawCarbDetail[3].split('=')[1],
        time: reformatISO(values[columns['Timestamp']])
      };

      if(parsers.validateCarb(data)){
        return callback(null, data);
      }
    }
    return callback();
  },
  validateCarb : function(data) {
    return (
      !isNaN(data.carbs)  &&
      data.carbs > 0 &&
      !isNaN(data.value) &&
      data.value > 0 &&
      data.units &&
      data.type == 'carbs' &&
      tidepoolDateTime.isValidDateTime(data.time));
  }
};

function validator (valid) {
  function each (data, next) {
    if (valid(data)) {
      return next(null, data);
    }
    next( );
  }
  return es.map(each);
}

var mmcsv = function() {

  var responder = function(filter, parse, valid) {
    var tr = es.through();

    stream.on('type', function(data) {
      if (data.type.match(filter)) {
        return tr.push(data.data);
      }
    });
    return es.pipeline(stream, tr);
  };

  var patterns = {
    smbg: /BGBayer|BGReceived|CalBGForPH/g,
    cbg: /GlucoseSensorData|BGLifeScan|BGTherasense/g,
    bolus: /BolusNormal|BolusSquare/g,
    basal: /CurrentBasalProfile\b|BasalProfileStart/g,
    carbs: /BolusWizardBolusEstimate/g,
    all: /BGBayer|BGReceived|CalBGForPH|GlucoseSensorData|BGLifeScan|BGTherasense|BolusNormal|BolusSquare|CurrentBasalProfile\b|BasalProfileStart|BolusWizardBolusEstimate/g //todo make this smarter
  };
  var dispatched = {
    smbg: { pattern: patterns.smbg
          , parse: es.map(parsers.smbg)
          , validate: validator(parsers.validateSmbg)
          }
    
  };

  var stream = es.pipeline(es.split(), es.map(function(data, callback) {
    var fields = data.split(',');

    if (fields.length < 36) {
      return callback(null, data);
    } else {
      stream.emit('type', {type: fields[33], data: data});
      return callback();
    }
  }));

  var keys = Object.keys(dispatched);
  function mint(key) {
    var handle = dispatched[key];
    function create (opts) {
      var pipe = es.pipeline(responder(handle.pattern), handle.parse);
      if (handle.validate) {
        pipe = es.pipeline(pipe, handle.validate);
      }
      return pipe;
    }
    stream[key] = create;
    return create;
  }
  keys.forEach(mint);

  stream.cbg = function( ) {
    return es.pipeline(responder(patterns.cbg), es.map(
      function(raw, callback) {
        parsers.cbg(raw, callback);
      })
    );
  };

  stream.bolus = function( ) {
    return es.pipeline(responder(patterns.bolus), es.map(
      function(raw, callback) {
        parsers.bolus(raw, callback);
      })
    );
  };

  stream.basal = function( ) {
    return es.pipeline(responder(patterns.basal), es.map(
      function(raw, callback) {
        parsers.basal(raw, callback);
      })
    );
  };

  stream.carbs = function( ) {
    return es.pipeline(responder(patterns.carbs), es.map(
      function(raw, callback) {
        parsers.carbs(raw, callback);
      })
    );
  };

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

  stream.responder = responder;

  return stream;
};

mmcsv.splitIntoFields = function(rawData) {
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
};

mmcsv.isCgm = function(entryValues) {
  var isCgm;
  isCgm = entryValues[columns['Sensor Glucose (mg/dL)']] || entryValues[columns['Raw-Type']] === 'BGTherasense' ? true : false;
  return isCgm;
};

mmcsv.isSmbg = function(entryValues) {
  var isSmbg, smbgValue;

  smbgValue = entryValues[columns['BG Reading (mg/dL)']];
  isSmbg = entryValues[columns['BG Reading (mg/dL)']] || entryValues[columns['Sensor Calibration BG (mg/dL)']];

  return isSmbg;
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
