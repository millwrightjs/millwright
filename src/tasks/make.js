const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});
const cache = require('../utils/cache');
const config = require('../config');

module.exports = make;

function make(opts) {
  const task = process.env.task || 'make';

  if (opts && opts.targeted && opts.assets) {
    return run(opts.assets);
  }

  cache.clear();

  clean();

  cache.set('files', 'srcResolved', plugins.normalize(fs.walkSync(config.srcDir)));

  _(cache.get('deps'))
    .filter({role: 'asset'})
    .forEach(dep => {
      let asset = cache.get('files')[dep.srcResolved];
      if (!asset) {
        asset = plugins.normalize([dep.src])[0];
        cache.set('files', 'srcResolved', asset);
      }
      asset.role = 'asset';
      asset.isMinified = asset.isMinified || dep.isMinified;
    });

  // We should remove passive assets from the file cache by this point

  _(cache.get('files')).filter({role: 'template'}).forEach(plugins.static);


  return run();

  function run(assets) {
    const transformAssets = runTransformAssets(assets || _.filter(cache.get('files'), {role: 'asset'}));

    return Promise.all(transformAssets)
      .then(() => {
        let deps = _.filter(cache.get('deps'), dep => dep.role === 'asset');
        if (assets) {
          const assetSources = _.map(assets, 'srcResolved');
          deps = deps.reduce((acc, dep) => {
            if (assetSources.includes(dep.srcResolved)) {
              acc.push(dep);
            }
            return acc;
          }, []);
        }
        return Promise.all(_.castArray(runGenerateDeps(deps)));
      })
      .then(() => {
        return Promise.all(_.filter(assets || cache.get('files'), f => !f.role).map(asset => {
          const dest = path.join(config.destBase, asset.srcStripped);
          return fs.copy(asset.src, dest);
        }));
      });
  }

  function runTransformAssets(assets) {
    return _(assets)
      .pipe(plugins.normalizeAsset, !_.get(opts, 'targeted'))
      .pipe(plugins.read)
      .pipe(plugins.transpile, a => !a.isMinified)
      .pipeTap(plugins.cacheImport, a => !a.isMinified)
      .pipe(plugins.copySource)
      .pipe(plugins.minify, a => !a.isMinified, task === 'build')
      .pipe(plugins.remapSources, a => a.map)
      .value();
  }

  function runGenerateDeps(deps) {
    return _(deps)
      .pipe(plugins.normalizeDep)
      .pipe(plugins.getAssetContent)
      .pipeAll(plugins.concat, task === 'build')
      .pipe(plugins.outputSourcemaps)
      .pipe(plugins.output)
      .value();
  }
}
