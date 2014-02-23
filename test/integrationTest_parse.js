var should = require('should');
var fs = require('fs');
var _ = require('lodash');
var moment = require('moment');

describe("parse", function() {
	it('should exist cand be callable', function(done) {
        var Parse = require('../lib/parse');
        should.exist(Parse);
        should.exist(Parse.call);
        done();
    });
    
    describe("smbg integration tests", function() {
      it('should emit 7 SMBG readings', function(done) {
        var input = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var Parse = require('../lib/parse');
        var es = require('event-stream');

        var stream = es.pipeline(input, Parse.smbg( )
          , es.writeArray( function (err, readings) {
              should.not.exist(err);
              readings.length.should.equal(7);
              var values = _.map(readings, function (v) {
                return parseInt(v.value);
              });
              values.should.include(155);
              values.should.include(128);
              values.should.include(219);
              values.should.include(131);
              values.should.include(90);
              values.should.include(57);
              values.should.include(166);

              done( );
          })
        );
      });

    });

    describe("carb integration tests", function() {
      var es = require('event-stream');
      var Parse = require('../lib/parse');
      it('should emit 16 carb records', function(done) {

        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var stream = toProcess.pipe(Parse.carbs( ));
        es.pipeline(stream,  es.writeArray(function finish (err, readings) {
          readings.length.should.equal(16);
          done( );
        }));
      });
    });

    describe("bolus integration tests", function() {
      var es = require('event-stream');
      var Parse = require('../lib/parse');

      it('should emit 16 bolus records', function(done) {
        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var stream = toProcess.pipe(Parse.bolus( ));
        es.pipeline(stream,  es.writeArray(function finish (err, readings) {
          readings.length.should.equal(16);
          done( );
        }));
      });
    });

    describe("basal integration tests", function() {
      var es = require('event-stream');
      var Parse = require('../lib/parse');

      it('should emit 9 basal records', function(done) {
        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var stream = toProcess.pipe(Parse.basal( ));
        es.pipeline(stream,  es.writeArray(function finish (err, readings) {
          readings.length.should.equal(9);
          done( );
        }));
      });

    });

});
