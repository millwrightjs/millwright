const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));

module.exports = function copy(file) {
  return fs.copy(file.src, file.dest, {dereference: true}).then(() => file);
}
