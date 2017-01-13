const fs = require('fs-extra');
const config = require('../config');

module.exports = clean;

function clean() {
  fs.removeSync(config.destDir);
}
