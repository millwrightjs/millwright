const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs-extra'));

module.exports = function output(file) {
  return fs.outputFileAsync(file.dest, file.content).then(() => file);
}
