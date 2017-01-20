const path = require('path');
const _ = require('lodash');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs-extra'));

module.exports = function read(file) {
  return fs.readFileAsync(file.src).then(result => {
    return _.assign(file, {content: result.toString()});
  });
};
