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

function make() {
  const task = process.env.task || 'make';

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

  const generateDeps = Promise.all(transformAssets).then(() => {
    return Promise.all(runGenerateDeps(cache.get('deps')));
  });

  function runTransformAssets(assets) {
    return _(assets)
      .pipe(plugins.normalizeAsset)
      .pipe(plugins.read)
      .pipe(plugins.transpile, a => !a.isMinified)
      .pipe(plugins.copySource)
      .pipe(plugins.minify, a => !a.isMinified, task === 'build')
      .pipe(plugins.remapSources(task), a => a.map)
      .pipe(asset => cache.set('files', 'srcResolved', asset))
      .value();
  }

  function runGenerateDeps(deps) {
    return _(deps)
      .pipe(plugins.normalizeDep)
      .pipe(dep => {
        const {content, map, mapImports} = cache.get('files', dep.srcResolved);
        return _.assign({}, dep, {content, map, mapImports});
      })
      .pipeAll(plugins.concat, task === 'build')
      .pipe(plugins.outputSourcemaps)
      .pipe(plugins.output)
      .value();
  }

  return Promise.all(_.flatten([generateDeps, copyPassiveAssets]));
}

