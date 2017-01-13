'use strict';

var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');

var configPath = path.join(process.cwd(), 'millwright.json');
var config = _.attemptSilent(fs.readJsonSync, configPath);

var defaults = {};
defaults.defaultCommand = 'dev';
defaults.srcDir = 'src';
defaults.destDir = 'dest';
defaults.partialsDir = 'partials';
defaults.lambdasDir = 'lambdas';
defaults.assetIgnoredBasePaths = [defaults.srcDir, 'bower_components', 'node_modules'];
defaults.templateTags = ['{[{', '}]}'];

var defaultsCustom = _.assign({}, defaults, config);

defaultsCustom.partialsDir = path.join(defaultsCustom.srcDir, defaultsCustom.partialsDir);
defaultsCustom.lambdasDir = path.join(defaultsCustom.srcDir, defaultsCustom.lambdasDir);

module.exports = defaultsCustom;