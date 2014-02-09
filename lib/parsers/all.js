
var es = require('event-stream');
module.exports = function configure (master, all, utils) {
  function multiplex ( ) {
    var out = es.through( );
    var incoming = es.through(dispatch);
    master.on('type', function mux (d) { incoming.write(d); });
    function dispatch (item) {
      all.forEach(function findEmit (handler) {
        if (item.type.match(handler.pattern)) {
          handler.stream.write(item.data);
        }
      });
    }
    function tap (tapped) {
      tapped.stream.pipe(es.through(function transfer (data) {
        out.emit('data', data);
      }));
    }
    all.forEach(tap);
    return es.pipeline(master, out, utils.validate( ));
  }
  return multiplex;
}
