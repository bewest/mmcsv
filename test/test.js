var mmcsv = require('../');

mmcsv.fetch('<user-name>', '<user-password>', 120, 100, function(err, data) {
  console.log(err, data.length);
});