
var parsers = {
  smbg :
  function parse (raw, callback) {
    var values = mmcsv.splitIntoFields(raw);
 
    var bg = values[columns['BG Reading (mg/dL)']];
   
    if(isNaN(parseFloat(bg))){
      bg = values[columns['Sensor Calibration BG (mg/dL)']];
    }      

    if(bg){

      var data = {
        value: bg,
        type: 'smbg',
        time: mmcsv.reformatISO(mmcsv.select(values[columns['Timestamp']])
      };
      return callback(null, data);
    }
    return callback();

  },
  validateSmbg : function validate (data) {
    return (data && !isNaN(data.value) && data.value > 0 && data.type == 'smbg');
      // && tidepoolDateTime.isValidDateTime(data.time));
  }
};
module.exports = function config (mmcsv) {

}

