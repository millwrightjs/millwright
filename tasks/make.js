const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const config = require('../config');

module.exports = make;

function make(opts = {}) {
  const watch = process.env.watch;
  const task = process.env.task || 'make';

  if (watch) {
    const assets = opts.paths.map(asset => {
      const props = {
        basePath: path.dirname(asset.data),
        wrapper: path.basename(asset.data, '.json') === 'wrapper'
      }
      return _.assign({}, asset, props);
    });
    return runGenerateAssets(assets);
  }

  clean();

  cache.set('files', 'srcResolved', plugins.normalize(fs.walkSync(config.srcDir)));

  cache.get('deps').forEach(dep => {
    cache.get('files')[dep.srcResolved].role = 'asset';
  });

  const copyPassiveAssets = _.filter(cache.get('files'), f => !f.role).map(asset => {
    const dest = path.join(config.destBase, asset.srcStripped);
    return fs.copy(asset.src, dest);
  });

  // We should remove passive assets from the file cache by this point

  _(cache.get('files')).filter({role: 'template'}).forEach(plugins.static);

  const transformAssets = runTransformAssets(_.filter(cache.get('files'), {role: 'asset'}));
  const generateDeps = runGenerateDeps(cache.get('deps'));

  // Iterate over files
  function runTransformAssets(assets) {
    return _(assets)
      .pipe(plugins.normalizePaths, watch)
      .pipe(plugins.read)
      .pipe(plugins.transpile, a => !a.isMinified)
      .pipe(plugins.copySource)
      .pipe(plugins.minify, a => !a.isMinified, task === 'build')
      .pipe(plugins.remapSources(task), a => a.map)
      .pipe(asset => cache.set('files', 'srcResolved', asset))
      .value();
  }

  // Iterate over deps
  function runGenerateDeps(deps) {
    return _(deps)
      .pipeAll(plugins.concat, task === 'build')
      .pipe(plugins.outputSourcemaps)
      .pipe(plugins.output)
      .value();
  }

  return Promise.all(_.flatten([generateDeps, copyPassiveAssets]));
}

