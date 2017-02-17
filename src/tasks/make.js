const _ = require('lodash');
const path = require('path');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs-extra'));
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
            if (_.includes(assetSources, dep.srcResolved)) {
              acc.push(dep);
            }
            return acc;
          }, []);
        }
        return Promise.all(_.castArray(runGenerateDeps(deps)))
      })
      .then(result => Promise.all(_.flatten(result)))
      .then(() => {
        return Promise.all(_.filter(assets || cache.get('files'), f => !f.role).map(asset => {
          const dest = path.join(config.destDir, asset.srcStripped);
          return fs.copyAsync(asset.src, dest);
        }));
      });
  }

  function runTransformAssets(assets) {
    return _(assets)
      .flow(plugins.normalizeAsset, !_.get(opts, 'targeted'))
      .flow(plugins.read)
      .flow(plugins.transpile, a => !a.isMinified)
      .flowTap(plugins.cacheImport, a => !a.isMinified)
      .flow(plugins.copySource)
      .flow(plugins.minify, a => !a.isMinified, task === 'build')
      .flow(plugins.remapSources, a => a.map)
      .value();
  }

  function runGenerateDeps(deps) {
    return _(deps)
      .flow(plugins.normalizeDep)
      .flow(plugins.getAssetContent)
      .flowLog()
      .flowAll(plugins.concat, task === 'build')
      .flow(plugins.outputSourcemaps)
      .flow(plugins.output)
      .value();
  }
}
