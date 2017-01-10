const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const defaults = {};
defaults.destBase = 'dest';
defaults.serveRoot = defaults.destBase;
defaults.servePort = 8080;
defaults.servePath = 'http://localhost:' + defaults.servePort;
defaults.defaultCommand = 'dev';
defaults.templateIgnoredBasePaths = ['src', 'bower_components', 'node_modules'];
defaults.srcDir = 'src';
defaults.wrapperPath = path.join(defaults.srcDir, 'wrapper.mustache');
defaults.wrapperDataPath = path.join(defaults.srcDir, 'wrapper.json');
defaults.partialsDir = path.join(defaults.srcDir, 'partials');
defaults.lambdasDir = path.join(defaults.srcDir, 'lambdas');

defaults.serveMsg = 'Millwright serving at ' + defaults.servePath + '...';

module.exports = _.assign(defaults, config);
