'use strict';

var _ = require('lodash');
var path = require('path');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));
var clean = require('./clean');
var requireDir = require('require-dir');
var plugins = _.mapValues(requireDir('../plugins', { camelcase: true }), _.curry);
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

  cache.get('deps').filter(function (dep) {
    return dep.role === 'asset';
  }).forEach(function (dep) {
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
      var deps = cache.get('deps').filter(function (dep) {
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
        var dest = path.join(config.destBase, asset.srcStripped);
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
    }, task === 'build').pipe(plugins.remapSources(task), function (a) {
      return a.map;
    }).value();
  }

  function runGenerateDeps(deps) {
    return _(deps).pipe(plugins.normalizeDep).pipe(function (dep) {
      var _cache$get = cache.get('files', dep.srcResolved),
          content = _cache$get.content,
          map = _cache$get.map,
          mapImports = _cache$get.mapImports;

      return _.assign({}, dep, { content: content, map: map, mapImports: mapImports });
    }).pipeAll(plugins.concat, task === 'build').pipe(plugins.outputSourcemaps).pipe(plugins.output).value();
  }
}