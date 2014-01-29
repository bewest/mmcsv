var columns = {
  'Index': 0,
  'Date': 1,
  'Time': 2,
  'Timestamp': 3,
  'New Device Time': 4,
  'BG Reading (mg/dL)': 5,
  'Linked BG Meter ID': 6,
  'Temp Basal Amount (U/h)': 7,
  'Temp Basal Type': 8,
  'Temp Basal Duration (hh:mm:ss)': 9,
  'Bolus Type': 10,
  'Bolus Volume Selected (U)': 11,
  'Bolus Volume Delivered (U)': 12,
  'Programmed Bolus Duration (hh:mm:ss)': 13,
  'Prime Type': 14,
  'Prime Volume Delivered (U)': 15,
  'Suspend': 16,
  'Rewind': 17,
  'BWZ Estimate (U)': 18,
  'BWZ Target High BG (mg/dL)': 19,
  'BWZ Target Low BG (mg/dL)': 20,
  'BWZ Carb Ratio (grams)': 21,
  'BWZ Insulin Sensitivity (mg/dL)': 22,
  'BWZ Carb Input (grams)': 23,
  'BWZ BG Input (mg/dL)': 24,
  'BWZ Correction Estimate (U)': 25,
  'BWZ Food Estimate (U)': 26,
  'BWZ Active Insulin (U)': 27,
  'Alarm': 28,
  'Sensor Calibration BG (mg/dL)': 29,
  'Sensor Glucose (mg/dL)': 30,
  'ISIG Value': 31,
  'Daily Insulin Total (U)': 32,
  'Raw-Type': 33,
  'Raw-Values': 34,
  'Raw-ID': 35,
  'Raw-Upload ID': 36,
  'Raw-Seq Num': 37,
  'Raw-Device Type': 38,
};
function select (k) {
  return columns[k];
}

function fetch (o, k) {
  return o[select(k)];
}

module.exports = columns;
module.exports.select = select;
module.exports.fetch = fetch;
