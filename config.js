const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const defaults = {
  destBase: 'dest',
  serveRoot: 'dest',
  servePort: 8080,
  servePath: 'http://localhost:8080',
  defaultCommand: 'dev'
}

defaults.serveMsg = 'Millwright serving at ' + defaults.servePath + '...';

module.exports = _.assign(defaults, config);
