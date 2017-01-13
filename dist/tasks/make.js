'use strict';

var _ = require('lodash');
var path = require('path');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));
var clean = require('./clean');
var requireDir = require('require-dir');
var plugins = requireDir('../plugins', { camelcase: true });
var cache = require('../utils/cache');
var config = require('../config');

module.exports = make;

function make(opts) {
  var task = process.env.task || 'make';

  if (opts && opts.targeted && opts.assets) {
    return run(opts.assets);
  }

  cache.clear();

  clean();

  cache.set('files', 'srcResolved', plugins.normalize(fs.walkSync(config.srcDir)));

  _(cache.get('deps')).filter({ role: 'asset' }).forEach(function (dep) {
    var asset = cache.get('files')[dep.srcResolved];
    if (!asset) {
      asset = plugins.normalize([dep.src])[0];
      cache.set('files', 'srcResolved', asset);
    }
    asset.role = 'asset';
    asset.isMinified = asset.isMinified || dep.isMinified;
  });

  // We should remove passive assets from the file cache by this point

  _(cache.get('files')).filter({ role: 'template' }).forEach(plugins.static);

  return run();

  function run(assets) {
    var transformAssets = runTransformAssets(assets || _.filter(cache.get('files'), { role: 'asset' }));

    return Promise.all(transformAssets).then(function () {
      var deps = _.filter(cache.get('deps'), function (dep) {
        return dep.role === 'asset';
      });
      if (assets) {
        (function () {
          var assetSources = _.map(assets, 'srcResolved');
          deps = deps.reduce(function (acc, dep) {
            if (assetSources.includes(dep.srcResolved)) {
              acc.push(dep);
            }
            return acc;
          }, []);
        })();
      }
      return Promise.all(_.castArray(runGenerateDeps(deps)));
    }).then(function () {
      return Promise.all(_.filter(assets || cache.get('files'), function (f) {
        return !f.role;
      }).map(function (asset) {
        var dest = path.join(config.destDir, asset.srcStripped);
        return fs.copy(asset.src, dest);
      }));
    });
  }

  function runTransformAssets(assets) {
    return _(assets).pipe(plugins.normalizeAsset, !_.get(opts, 'targeted')).pipe(plugins.read).pipe(plugins.transpile, function (a) {
      return !a.isMinified;
    }).pipeTap(plugins.cacheImport, function (a) {
      return !a.isMinified;
    }).pipe(plugins.copySource).pipe(plugins.minify, function (a) {
      return !a.isMinified;
    }, task === 'build').pipe(plugins.remapSources, function (a) {
      return a.map;
    }).value();
  }

  function runGenerateDeps(deps) {
    return _(deps).pipe(plugins.normalizeDep).pipe(plugins.getAssetContent).pipeAll(plugins.concat, task === 'build').pipe(plugins.outputSourcemaps).pipe(plugins.output).value();
  }
}