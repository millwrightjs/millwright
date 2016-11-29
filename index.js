process.on('uncaughtException', e => {console.log(e); process.exit(1);});
process.on('unhandledRejection', e => {console.log(e); process.exit(1);});

require('./utils/lodash-utils');
require('./utils/lodash-pipes');
const argv = require('yargs').argv;
const requireDir = require('require-dir');
const tasks = requireDir('./tasks', {camelcase: true});
const config = require('./config');

const cmd = argv._[0] || config.defaultCommand;

module.exports = tasks[cmd];
