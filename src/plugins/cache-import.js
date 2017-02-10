const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});
const cache = require('../utils/cache');

module.exports = cacheImport;

function cacheImport(files) {
  _.forEach(files, file => {
    _.forEach(file.mapImports, source => {
      const resolved = path.resolve(source);
      if (pathExists(resolved)) {
        cache.push('deps', {
          src: source,
          srcResolved: resolved,
          consumer: file.srcResolved
        });

        const cached = cache.get('files', resolved);

        if (cached) {
          cached.role = cached.role || 'import';
        } else {
          cache.set('files', 'srcResolved', plugins.normalizeBase(source));
        }
      }
    });
  });
}
