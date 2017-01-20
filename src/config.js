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
defaults.assetIgnoredBasePaths = ['bower_components', 'node_modules'];
defaults.templateTags = ['{[{', '}]}'];

const defaultsCustom = _.assign({}, defaults, config);

// Test environment overrides
if (process.env.MILL_TEST === 'TRUE') {
  defaultsCustom.defaultCommand = process.env.MILL_TEST_CMD;
  defaultsCustom.srcDir = process.env.MILL_TEST_SRC;
  defaultsCustom.destDir = process.env.MILL_TEST_DEST;
}

defaultsCustom.assetIgnoredBasePaths.push(defaultsCustom.srcDir);
defaultsCustom.partialsDir = path.join(defaultsCustom.srcDir, defaultsCustom.partialsDir);
defaultsCustom.lambdasDir = path.join(defaultsCustom.srcDir, defaultsCustom.lambdasDir);

module.exports = defaultsCustom;
