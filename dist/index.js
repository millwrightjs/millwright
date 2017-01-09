'use strict';

// TODO: remove uncaught exception logging
// This is in place temporarily to ensure we at least get a stack trace on failure while the project
// is in alpha.
process.on('uncaughtException', function (e) {
  console.log(e);process.exit(1);
});
process.on('unhandledRejection', function (e) {
  console.log(e);process.exit(1);
});

require('./utils/lodash-utils');
require('./utils/lodash-pipes');
var argv = require('yargs').argv;
var requireDir = require('require-dir');
var tasks = requireDir('./tasks', { camelcase: true });
var config = require('./config');

var cmd = argv._[0] || config.defaultCommand;

module.exports = tasks[cmd];