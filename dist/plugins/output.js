'use strict';

var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));

module.exports = function output(file) {
  return fs.outputFile(file.dest, file.content).then(function () {
    return file;
  });
};