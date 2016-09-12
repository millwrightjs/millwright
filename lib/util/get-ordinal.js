module.exports = getOrdinal;

function getOrdinal(num) {
  if((parseFloat(num) === parseInt(num)) && !isNaN(num)) {
    var suffixes=["th","st","nd","rd"];
    var remainder = num % 100;
    return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
  }
  return num;
}
