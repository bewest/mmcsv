'use strict';

var es = require('event-stream'),
  moment = require('moment'),
  TidepoolDateTime = require('sundial'),
  tidepoolDateTime = new TidepoolDateTime();

var columns = {
  'Index': 0,
  'Date': 1,
  'Time': 2,
  'Timestamp': 3,
  'New Device Time': 4,
  'BG Reading (mg/dL)': 5,
  'Linked BG Meter ID': 6,
  'Temp Basal Amount (U/h)': 7,
  'Temp Basal Type': 8,
  'Temp Basal Duration (hh:mm:ss)': 9,
  'Bolus Type': 10,
  'Bolus Volume Selected (U)': 11,
  'Bolus Volume Delivered (U)': 12,
  'Programmed Bolus Duration (hh:mm:ss)': 13,
  'Prime Type': 14,
  'Prime Volume Delivered (U)': 15,
  'Suspend': 16,
  'Rewind': 17,
  'BWZ Estimate (U)': 18,
  'BWZ Target High BG (mg/dL)': 19,
  'BWZ Target Low BG (mg/dL)': 20,
  'BWZ Carb Ratio (grams)': 21,
  'BWZ Insulin Sensitivity (mg/dL)': 22,
  'BWZ Carb Input (grams)': 23,
  'BWZ BG Input (mg/dL)': 24,
  'BWZ Correction Estimate (U)': 25,
  'BWZ Food Estimate (U)': 26,
  'BWZ Active Insulin (U)': 27,
  'Alarm': 28,
  'Sensor Calibration BG (mg/dL)': 29,
  'Sensor Glucose (mg/dL)': 30,
  'ISIG Value': 31,
  'Daily Insulin Total (U)': 32,
  'Raw-Type': 33,
  'Raw-Values': 34,
  'Raw-ID': 35,
  'Raw-Upload ID': 36,
  'Raw-Seq Num': 37,
  'Raw-Device Type': 38,
};

var DATE_TIME_MASK = 'MM/DD/YYTHH:mm:ss';

function reformatISO (str) {
  var m = moment(str, DATE_TIME_MASK);
  var display = 'YYYY-MM-DDTHH:mm:ss';
  return m.format(display);
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

      if(parsers.validateSmbg(data)){
        return callback(null, data);
      }
    }
    return callback();

  },
  validateSmbg : function(data) {
    return (
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

  var patterns = {
    smbg: /BGBayer|BGReceived|CalBGForPH/g,
    cbg: /GlucoseSensorData|BGLifeScan|BGTherasense/g,
    bolus: /BolusNormal|BolusSquare/g,
    basal: /CurrentBasalProfile\b|BasalProfileStart/g,
    carbs: /BolusWizardBolusEstimate/g,
    all: /BGBayer|BGReceived|CalBGForPH|GlucoseSensorData|BGLifeScan|BGTherasense|BolusNormal|BolusSquare|CurrentBasalProfile\b|BasalProfileStart|BolusWizardBolusEstimate/g //todo make this smarter
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

  stream.smbg = function( ) {
    return es.pipeline(responder(patterns.smbg), es.map(
      function(raw, callback) {
        parsers.smbg(raw, callback);
      })
    );
  };

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
