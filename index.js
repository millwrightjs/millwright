process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);

const argv = require('yargs').argv;
const requireDir = require('require-dir');
const tasks = requireDir('./tasks', {camelcase: true});
const config = require('./config');

const cmd = argv._[0] || config.defaultCommand;;

module.exports = tasks[cmd];

