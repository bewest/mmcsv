
var generate = require('../lib/generate');
var should = require('should');
var es = require('event-stream');

describe('generate schedule', function ( ) {
  it('generate', function (done) {
    var program = "0,1;when=2012-01-01T00:00:00";
    var schedule = generate.basalSchedule(program, {before: 1, after: 1});
    var rates = generate.basalPatterns(schedule);
    es.pipeline(rates, es.writeArray(finish));
    function finish (err, results) {
      var correct = [ { microseconds: '0',
          rate: '1',
          type: 'basal',
          time: '2014-02-09T00:00:00',
          basal: '1',
          value: '1',
          start: '2014-02-09T00:00:00' },
        { microseconds: '0',
          rate: '1',
          type: 'basal',
          time: '2014-02-10T00:00:00',
          basal: '1',
          value: '1',
          start: '2014-02-10T00:00:00' },
        { microseconds: '0',
          rate: '1',
          type: 'basal',
          time: '2014-02-11T00:00:00',
          basal: '1',
          value: '1',
          start: '2014-02-11T00:00:00' },
        { microseconds: '0',
          rate: '1',
          type: 'basal',
          time: '2014-02-12T00:00:00',
          basal: '1',
          value: '1',
          start: '2014-02-12T00:00:00' } ]
      ;
      results.should.containEql(correct[0]);
      results.should.containEql(correct[1]);
      results.should.containEql(correct[2]);
      results.should.containEql(correct[3]);
      done( );
    }
  });
  it('generate two rates', function (done) {
    var program = "0,1;23400000,2;when=2012-01-01T00:00:00";
    var schedule = generate.basalSchedule(program, { });
    var rates = generate.basalPatterns(schedule);
    es.pipeline(rates, es.writeArray(finish));
    function finish (err, results) {
      var correct = [ { microseconds: '0',
          rate: '1',
          type: 'basal',
          time: '2014-02-11T00:00:00',
          basal: '1',
          value: '1',
          start: '2014-02-11T00:00:00' },
        { microseconds: '23400000',
          rate: '2',
          type: 'basal',
          time: '2014-02-11T06:30:00',
          basal: '2',
          value: '2',
          start: '2014-02-11T06:30:00' } ]
      ;
      results.should.containEql(correct[0]);
      results.should.containEql(correct[1]);
      done( );
    }
  });
});
