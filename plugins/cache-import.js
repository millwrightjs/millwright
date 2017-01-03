const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;
const cache = require('../utils/cache');

module.exports = cacheImport;

function cacheImport(files) {
  _.forEach(files, file => {
    _.forEach(file.mapImports, source => {
      const resolved = path.resolve(source);
      if (pathExists(resolved)) {
        cache.push('imports', {
          src: source,
          srcResolved: resolved,
          consumer: file.srcResolved
        });
        const cached = cache.get('files', resolved);
        cached.role = cached.role || 'import';
      }
    });
  });
}
