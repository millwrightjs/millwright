'use strict';

var fs = require('fs-extra');
var config = require('../config');

module.exports = clean;

function clean() {
  fs.removeSync(config.destBase);
}