
var tabtab = require('tabtab');
var args = require('./args');

function completer ( ) {
  var opts = args(process.argv.slice(3));
  var parsed = tabtab.parseOut(opts.help( ));
  parsed.longs.push('help');
  return tabtab.complete('mmcsv', function(err, o) {
    if (err || !o) return;
    if (!parsed) { return; }

    if (o.words < 2) {
      return tabtab.log(['fetch', 'parse', 'help', 'version'], o, '');
    }
    var a = o.line.split(' ').slice(1);
    var opts = args(a);
    switch (opts.command || o.prev) {
      case 'fetch':
        fetch( );
        break;
      case 'parse':
        parse(o);
        break;
    }
  });
  if (tabtab.isComplete( )) {

    return;
  }
}

module.exports = completer;

function parse (o) {
  if (o) {
    var opts = args(o.line.split(' '));
    return tabtab.log(['filter=all', 'filter=smbg', 'filter=carbs',
                'filter=basal', 'filter=cbg', 'filter=bolus'], o, '--');
  }
}

function fetch ( ) {
  tabtab.complete('mmcsv', 'fetch', function(err, o) {
    if (o) {
      var opts = args(o.line.split(' '));
      if (!opts.username || opts.username == '') {
        tabtab.log(['username', 'password' ], o, '--');
      }
      if (opts.username && !opts.password) {
        tabtab.log(['password'], o, '--');
      }
      if (/--?\w?/g.test(o.last)) return tabtab.log(parsed.longs, o, '--');
      if (/^-\w?/.test(o.last)) return tabtab.log(parsed.shorts, o, '-');
    }
  });
}
