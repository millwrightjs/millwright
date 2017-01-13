const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const defaults = {};
defaults.defaultCommand = 'dev';
defaults.srcDir = 'src';
defaults.destDir = 'dest';
defaults.partialsDir = 'partials';
defaults.lambdasDir = 'lambdas';
defaults.assetIgnoredBasePaths = [defaults.srcDir, 'bower_components', 'node_modules'];
defaults.templateTags = ['{[{', '}]}'];

const defaultsCustom = _.assign({}, defaults, config);

defaultsCustom.partialsDir = path.join(defaultsCustom.srcDir, defaultsCustom.partialsDir);
defaultsCustom.lambdasDir = path.join(defaultsCustom.srcDir, defaultsCustom.lambdasDir);

module.exports = defaultsCustom;
