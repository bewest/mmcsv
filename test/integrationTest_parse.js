var should = require('should');
var fs = require('fs');
var _ = require('lodash');
var moment = require('moment');
var TIME_ZONE = -120;

describe("parse", function() {
	it('should exist cand be callable', function(done) {
        var Parse = require('../lib/parse');
        should.exist(Parse);
        should.exist(Parse.call);
        done();
    });
    
    describe("smbg integration tests", function() {
      it('should emit 14 SMBG readings', function(done) {
        var input = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var Parse = require('../lib/parse');
        var es = require('event-stream');

        var stream = es.pipeline(input, Parse.smbg(TIME_ZONE)
          , es.writeArray( function (err, readings) {
              should.not.exist(err);
              readings.length.should.equal(14);
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
    //BGBayer
    describe("smbg type tests", function() {
      it('BGBayer should in the smbg stream', function(done) {

        var Parse, es, Stream, bgTypeStream, toProcess, readings;

        Parse = require('../lib/parse');
        es = require('event-stream');

        toProcess = es.readArray(['1,10/1/13,02:30:00,10/1/13 02:30:00,,96,,,,,,,,,,,,,,,,,,,,,,,,,,,,BGBayer,"AMOUNT=96, EDIT_STATE=not edited, REFERENCE_METHOD=plasma, DEVICE_SEQ_NUM=493",11524149201,52627643,490,Bayer CONTOUR NEXT LINK']);
        
        var stream = Parse.smbg(TIME_ZONE);

        es.pipeline(toProcess, stream,  es.writeArray(function finish (err, readings) {
          readings.length.should.equal(1);
          done( );
        }));

      });

      it('should show year 2012, month Dec and day 20 for given raw time of 12/20/12 04:18:45', function(done) {

        var Parse, es, Stream, bgTypeStream, toProcess, readings;

        Parse = require('../lib/parse');
        es = require('event-stream');
        readings = [];

        toProcess = es.readArray(['1,12/20/12,04:18:45,12/20/12 04:18:45,,96,,,,,,,,,,,,,,,,,,,,,,,,,,,,BGBayer,"AMOUNT=96, EDIT_STATE=not edited, REFERENCE_METHOD=plasma, DEVICE_SEQ_NUM=493",11524149201,52627643,490,Bayer CONTOUR NEXT LINK']);
        
        var stream = toProcess.pipe(Parse.smbg(TIME_ZONE));

        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }

              var time = readings[0].time;
              time.should.equal('2012-12-20T04:18:45');

              done( );
          });

      });
      it('BGReceived should be recognised as a smbg', function(done) {
        var Parse, es, Stream, bgTypeStream, toProcess, readings;

        Parse = require('../lib/parse');
        es = require('event-stream');
        readings = [];

        toProcess = es.readArray(['70,10/4/13,18:43:58,10/4/13 18:43:58,,102,#C27532,,,,,,,,,,,,,,,,,,,,,,,,,,,BGReceived,"AMOUNT=102, ACTION_REQUESTOR=paradigm link or b key, PARADIGM_LINK_ID=C27532",11521576171,52626644,180,Paradigm Revel - 723']);
        
        var stream = toProcess.pipe(Parse.smbg(TIME_ZONE));

        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }
              readings.length.should.equal(1);
              done( );
          });
      });
      it('CalBGForPH is a recognised as a smbg', function(done) {
        var Parse, es, Stream, bgTypeStream, toProcess, readings;

        Parse = require('../lib/parse');
        es = require('event-stream');
        readings = [];

        toProcess = es.readArray(['21,10/3/13,20:36:38,10/3/13 20:36:38,,,,,,,,,,,,,,,,,,,,,,,,,,83,,,,CalBGForPH,"AMOUNT=83, ACTION_REQUESTOR=pump",11521576215,52626644,224,Paradigm Revel - 723']);
        
        var stream = toProcess.pipe(Parse.smbg(TIME_ZONE));

        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }
              readings.length.should.equal(1);
              done( );
            })
      });
    });
    describe("carb integration tests", function() {
      it('should emit 14 carb records', function(done) {

        var Parse = require('../lib/parse');
        

        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var readings = [ ];

        var stream = toProcess.pipe(Parse.carbs(TIME_ZONE));
        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }
              readings.length.should.equal(14);
              done( );
          });
      });
    });
    describe("bolus integration tests", function() {
      it('should emit 16 bolus records', function(done) {

        var Parse = require('../lib/parse');
        

        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var readings = [ ];

        var stream = toProcess.pipe(Parse.bolus(TIME_ZONE));
        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }
              readings.length.should.equal(16);
              done( );
          });
      });
    });
    describe("basal integration tests", function() {
      it('should emit 9 basal records', function(done) {

        var Parse = require('../lib/parse');
        
        var toProcess = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
        var readings = [ ];
        
        var stream = toProcess.pipe(Parse.basal(TIME_ZONE));
        stream
          .on( 'data', function(data) {
              readings.push(data);
            })
          .on( 'end',  function(data) {
              if (data) { readings.push(data); }

              readings.length.should.equal(9);
              done( );
          });
      });
    });
});
