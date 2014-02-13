
module.exports = function version ( ) {
  var P = require('../package.json');
  console.log("%s@%s", P.name, P.version);
}
