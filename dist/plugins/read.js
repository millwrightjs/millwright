'use strict';

var path = require('path');
var _ = require('lodash');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));

module.exports = function read(file) {
  return fs.readFile(file.src).then(function (result) {
    return _.assign(file, { content: result.toString() });
  });
};