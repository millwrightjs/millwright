const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));

module.exports = function output(file) {
  return fs.copy(file.srcPath, file.destPath, {dereference: true}).then(() => file);
}
