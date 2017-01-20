// TODO: remove uncaught exception logging
// This is in place temporarily to ensure we at least get a stack trace on failure while the project
// is in alpha.
process.on('uncaughtException', e => {console.log(e); process.exit(1);});
process.on('unhandledRejection', e => {console.log(e); process.exit(1);});

require('./utils/lodash-utils');
require('./utils/lodash-flow');
const _ = require('lodash');
const argv = require('yargs').argv;
const requireDir = require('require-dir');
const tasks = requireDir('./tasks', {camelcase: true});
const config = require('./config');

const realCmd = Object.keys(tasks).indexOf(argv._[0]) >= 0;
const cmd = realCmd ? argv._[0] : config.defaultCommand;

module.exports = tasks[cmd];
