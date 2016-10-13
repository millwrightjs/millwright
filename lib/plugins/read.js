const path = require('path');
const _ = require('../lodash-extended');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));

module.exports = function read(file) {
  return fs.readFile(file.srcPath).then(result => {
    return _.assign(file, {content: result.toString()});
  });
};
