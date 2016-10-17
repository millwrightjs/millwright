const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('config');
const util = require('../util');

module.exports = function outputSourcemaps(file) {
  return fs.outputFile(file.sourcemapsPath, file.map)
    .then(() => {
      return _.map(file.mapImports, importPath => {
        const stripped = util.stripIgnoredBasePath(importPath, config.templateIgnoredBasePaths);
        const mapped = path.join(file.sourcemapsDir, stripped);
        return fs.copy(importPath, mapped, {dereference: true});
      });
    })
    .then(importPromises => Promise.all(importPromises))
    .then(() => file);
}
