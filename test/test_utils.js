
var should = require('should');
var es = require('event-stream');

describe("utils", function ( ) {
  var utils = require('../lib/utils');

  var invalidInput = { deviceTime: '2014-02-23T13:40:54', value: '' };
  it("piping invalid elements should yield empty", function (done) {
    var input = es.readArray([invalidInput]);
    function testEmpty (err, results) {
      results.should.be.empty;
      done( );
    }
    es.pipeline(input, utils.validate( ), es.writeArray(testEmpty));
  });
});
