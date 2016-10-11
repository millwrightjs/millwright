const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));

module.exports = function output(file) {
  return fs.outputFile(file.destPath, file.content).then(() => file);
}
