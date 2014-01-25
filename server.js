
var restify = require('restify')
  , handlers = require('./lib/handlers')
  , es = require('event-stream')
  ;

function createServer (opts) {
  var server = restify.createServer(opts);
  // These are optional.
  server.pre(restify.requestLogger( ));
  server.pre(restify.pre.sanitizePath( ));
  server.pre(restify.pre.userAgentConnection( ));

  server.use(restify.dateParser( ));
  server.use(restify.queryParser( ));
  server.use(restify.gzipResponse( ));

  handlers(server, opts);

  return server;
}

module.exports = createServer;
if (!module.parent) {
  var server = createServer({bodyParser: restify.bodyParser});
  var env = require('./env');
  var port = env.PORT;
  server.listen(port, function( ) {
    console.log('listening on', server.name, server.url);
  });
  // In true UNIX fashion, debug messages go to stderr, and audit records go
  // to stdout, so you can split them as you like in the shell
  var bunyan = require('bunyan');
  var log = bunyan.createLogger({
          name: 'server',
          streams: [ {
                  level: (env.LOG_LEVEL || 'info'),
                  stream: process.stderr
          }, {
                  // This ensures that if we get a WARN or above all debug records
                  // related to that request are spewed to stderr - makes it nice
                  // filter out debug messages in prod, but still dump on user
                  // errors so you can debug problems
                  level: 'warn',
                  type: 'raw',
                  stream: new restify.bunyan.RequestCaptureStream({
                          level: bunyan.WARN,
                          maxRecords: 100,
                          maxRequestIds: 1000,
                          stream: process.stderr
                  })
          } ],
          serializers: restify.bunyan.serializers
  });

  server.on('after', restify.auditLogger({
    body: true,
    log: log
  }));
}

