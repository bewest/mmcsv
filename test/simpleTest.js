var should = require('should');
var _ = require('lodash');
var moment = require('moment');

describe("parse", function() {
	it('should exist cand be callable', function(done) {
    var Parse = require('../lib/parse');
    should.exist(Parse);
    should.exist(Parse.call);
    done();
  });

  //BGBayer
  describe("smbg type tests", function() {
    var Parse = require('../lib/parse');
    var es = require('event-stream');

    it('BGBayer should in the smbg stream', function(done) {

      var toProcess = es.readArray(['1,10/1/13,02:30:00,10/1/13 02:30:00,,96,,,,,,,,,,,,,,,,,,,,,,,,,,,,BGBayer,"AMOUNT=96, EDIT_STATE=not edited, REFERENCE_METHOD=plasma, DEVICE_SEQ_NUM=493",11524149201,52627643,490,Bayer CONTOUR NEXT LINK']);
      
      var stream = Parse.smbg( );

      es.pipeline(toProcess, stream, es.writeArray(function finish (err, readings) {
        readings.length.should.equal(1);
        done( );
      }));

    });

    it('should show year 2012, month Dec and day 20 for given raw time of 12/20/12 04:18:45', function(done) {

      var toProcess = es.readArray(['1,12/20/12,04:18:45,12/20/12 04:18:45,,96,,,,,,,,,,,,,,,,,,,,,,,,,,,,BGBayer,"AMOUNT=96, EDIT_STATE=not edited, REFERENCE_METHOD=plasma, DEVICE_SEQ_NUM=493",11524149201,52627643,490,Bayer CONTOUR NEXT LINK']);
      
      var stream = toProcess.pipe(Parse( ).all( ));
      es.pipeline(stream, es.writeArray(function finish (err, readings) {
        var time = readings[0].deviceTime;
        time.should.equal('2012-12-20T04:18:45');
        done( );
      }));

    });
    it('BGReceived should be recognised as a smbg', function(done) {

      var toProcess = es.readArray(['70,10/4/13,18:43:58,10/4/13 18:43:58,,102,#C27532,,,,,,,,,,,,,,,,,,,,,,,,,,,BGReceived,"AMOUNT=102, ACTION_REQUESTOR=paradigm link or b key, PARADIGM_LINK_ID=C27532",11521576171,52626644,180,Paradigm Revel - 723']);
      
      var stream = toProcess.pipe(Parse( ).smbg( ));
      es.pipeline(stream,  es.writeArray(function finish (err, readings) {
        readings.length.should.equal(1);
        done( );
      }));
    });

    it('CalBGForPH is a recognised as a smbg', function(done) {

      var toProcess = es.readArray(['21,10/3/13,20:36:38,10/3/13 20:36:38,,,,,,,,,,,,,,,,,,,,,,,,,,83,,,,CalBGForPH,"AMOUNT=83, ACTION_REQUESTOR=pump",11521576215,52626644,224,Paradigm Revel - 723']);
      var stream = toProcess.pipe(Parse.all( ));
      es.pipeline(stream,  es.writeArray(function finish (err, readings) {
        readings.length.should.equal(1);
        done( );
      }));
    });
  });
});
