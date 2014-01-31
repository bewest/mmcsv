
var fs = require('fs')
  , es = require('event-stream')
  ;
var Parse = require('./parse');
var generate = require('./generate');

function parseUpload (req, res, next) {
  req.setEncoding('binary');
  // :parser should be one of: all, smbg, basal, et al.
  var parser = req.params.parser;
  // TODO: get from variable, maybe query param or header?
  //
  // select parser to use transform
  var mmcsv = Parse[parser];

  // For now we are using restify.bodyParser, which should provide
  // req.body or req.files.
  // if there was no POST body, there's nothing to do
  if (!req.body && !req.files) {
    res.send(['no POST body (expect mmcsv']);
    res.end(400);
  }

  // req.files is an object, we need an array later.
  // TODO: move this to middleware after bodyParser or rewrite
  // bodyParser to do something else and rewrite the logic here
  var file, files = [ ];
  for (var f in req.files) {
    file = req.files[f];
    files.push(file);
  }

  // set up the main processing stream
  var stream = es.pipeline(
    mmcsv( ), // initialize mmcsv stream
    // send transformed results to client
    es.writeArray(function (err, readings) {
      res.send([err, readings.length, readings]);
      res.end(204);
  }));

  // req.files, check that our array from above is not empty
  if (req.files && files.length > 0) {

    // setup file inputs; stream an array of files into a single
    // input stream
    es.pipeline(es.readArray(files), es.map(function (F, cb) {
      // create a readable stream from file, F
      var i = fs.createReadStream(F.path);
      i.pipe(stream); // pipe to stream
      // es.map always requires callback
      // TODO: just pass null instead?
      cb(null, i);
    }));
  }
  // bodyParser parses and assigns POST body to req.body
  if (req.body && req.body.length > 0) {
    // pipe parsed bodyParser's result into main configured stream
    es.readArray([req.body]).pipe(stream);
  }
  // calling next( ) allows things to happen async and avoids
  // hanging
  next( );

}

var P = require('../package.json');
/*
 * install routes on a server
 */
function install(server, opts) {
  server.get('/status', function (req, res, next) {
    res.send(200, "OK@" + P.version);
  });
  // Give some help
  server.get('/api/index', function (req, res, next) {
     var urls = [
      { url: '/api/parse/:parser', doc: "POST" }
     ];
     res.send(urls);
     next( );
  });
  // TODO: redo handling of uploads, restify.bodyParser works, but
  // buffers MIME parts into uploaded files.  For example, sending
  // mmcsv as text/csv will fail, send as text/plain instead.
  /**
   * Consistently transform POST body of mmcsv to json.
   *
   */
  // TODO: pass config to factory function
  server.post('/api/parse/:parser'
        , opts.bodyParser( )
        , parseUpload)

  var base = opts.prefix || '\\/api\\/gen\\/basal\\/';
  var rest = '(.*)';
  server.get(new RegExp(base + rest), function (req, res, next) {
    var programs = req.params[0];
    var opts = { before: (parseInt(req.params.before) || 0)
               , after: (parseInt(req.params.after) || 0) };
    console.log('PREP', opts, programs);
    var init = generate.basalSchedule(programs, opts);
    es.pipeline(generate.basalPatterns(init), es.writeArray(function (err, schedule) {
      res.send({schedule: schedule});
    }));
    next( );
  });

  return server;
}

module.exports = install;
module.exports.parseUpload = parseUpload;
module.exports.install = install;
