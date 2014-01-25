
var chrono = require('chrono-node')
  , moment = require('moment')
  , es = require('event-stream')
  ;

function parseRate (rate) {
  var fields = rate.split(',');
  var markers = rate.split('=');
  var result = {};
  if (fields.length > 0) {
    if (fields[1]) {
      result.microseconds = fields[0];
      result.rate = fields[1];
    }
  }
  if (markers.length == 2) {
    result[markers[0]] = markers[1];
  }
  return result;
}


var pattern = '(\\w+),(\\w+\\.\\w+)';
function basalSchedule (program, opts) {

  var profiles = program.split(';');
  // var rates = es.through( );
  var rates = writer('basalSchedule');
  var when = new Date( );
  var init = es.pipeline(es.readArray(profiles)
  , es.map(function (chunk, cb) {
      var rate = parseRate(chunk);
      if (rate.rate) {
        return cb(null, rate);
      }
      if (rate.when && rate.when != 'now') {
        // rate.write(when);
        rates.when = when = (chrono.parse(rate.when)[0].start.date( ));
      }
      return cb(null);

    })
  , es.writeArray (function (err, profiles) {
    var schedule;
    function beforeDays(w, days) {
      return moment(w).subtract(days + 1, 'day').toDate( );
    }
    function afterDays(w, days) {
      return moment(w).add(days + 1, 'day').toDate( );
    }
    while (opts.before > 0) {
      // need to clone objects, we want each of these to be their own
      // instances
      schedule = { profiles: JSON.parse(JSON.stringify(profiles)),
                   when: beforeDays(when, opts.before) };
      rates.write(schedule);
      opts.before--;
    }
    schedule = { profiles: JSON.parse(JSON.stringify(profiles)),
                 when: when };
    rates.write(schedule);
    for (var after = 0; after < opts.after; after++) {
      // need to clone objects, we want each of these to be their own
      // instances
      schedule = { profiles: JSON.parse(JSON.stringify(profiles)),
                   when: afterDays(when, after) };
      rates.write(schedule);
    }
    rates.end( );
  })
  );
  return rates;
}

function writer (msg) {
  function w (data) {
    console.log(msg, data);
    this.emit('data', data);
  }
  return es.through(w);
}

function basalPatterns (input) {
  // var rates = es.through( );
  var rates = writer('basalPatterns');
  var tr = es.through( );
  //tr.autoDestroy = false;
  var stream = es.pipeline(input, es.map( function (schedule, cb) {
    console.log('basalPatterns map', schedule.when);
    // rateStream(schedule.when, schedule.profiles).pipe(rates);
    var make = rateStream(schedule.when, schedule.profiles);
    es.pipeline(make,
      es.through( function write(data) {
        console.log('XXX', data.time);
        tr.write(data);

      }, function end( ) {
        console.log('INNER END', schedule.when);
        cb(null, make);
      })
    );
  }), es.writeArray( function (err, streams) {
    console.log('CAUGHT END 1', err, streams.length);
    tr.end( );
  }));
  return tr; // .pipe(rates);
}

function rateStream (day, profiles) {
  var my = {when: day, profiles: profiles};
  var midnight = function (day) { return moment(day).startOf('day'); };
  console.log('RATES FOR', midnight(day).format( ), day, midnight( ));
  var pattern = es.readArray(profiles);

  return es.pipeline(pattern,
  // return pattern.pipe(
      es.map( function (profile, cb) {
      var start = midnight(my.when);
      var time  = start.add(profile.microseconds / 1000, 'seconds');
      console.log("EACH RATE", start.format( ), time.format( ), profile.microseconds);
      profile.type = 'basal';
      profile.time = time.format( );
      profile.basal = profile.rate;
      profile.basal_type = 'Normal';
      profile.value = profile.rate;
      profile.start = profile.time;
      cb(null, profile);
    })
  );

}

module.exports.basalSchedule = basalSchedule;
module.exports.rateStream = rateStream;
module.exports.basalPatterns = basalPatterns;
