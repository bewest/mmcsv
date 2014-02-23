var should = require('should');
var fs = require('fs');
var es = require('event-stream');
var validators = require('tidepool-data-model');

describe("desalinate", function() {

  var desalinate = require('../lib/desalinate');
	it('should exist and be callable', function( ) {
    should.exist(desalinate);
    should.exist(desalinate.call);
  });
    
  describe("stream", function ( ) {
    it('has results', function ( ) {
      function proof (err, results) {
          results.length.should.equal(23);
          var report = validator(results);
          report.errors.should.be.empty;
      }

      var input = fs.createReadStream('test/1days_smbg_basal_bolus_carbs.csv');
      var validator = validators( );
      var stream = es.pipeline(input, desalinate( ), es.writeArray(proof));
    });

  });

});
