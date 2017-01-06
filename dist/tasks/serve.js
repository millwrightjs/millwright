'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var path = require('path');
var _ = require('lodash');
var chokidar = require('chokidar');
var bs = require('browser-sync').create();
var config = require('../config');
var cache = require('../utils/cache');
var make = require('./make');
var requireDir = require('require-dir');
var plugins = _.mapValues(requireDir('../plugins', { camelcase: true }), _.curry);

module.exports = serve;

function serve() {
  if (process.env.task !== 'build') {
    (function () {

      var srcDirResolved = path.resolve(config.srcDir);

      var aboveSrcPaths = _(cache.get('files')).keys().concat(_.map(cache.get('deps'), 'srcResolved')).filter(function (srcResolved) {
        return !srcResolved.startsWith(srcDirResolved);
      }).uniq().value();

      var watchOpts = {
        ignoreInitial: true
      };

      chokidar.watch([srcDirResolved].concat(_toConsumableArray(aboveSrcPaths)), watchOpts).on('all', function (event, changedPath) {
        if (event !== 'change') {
          return make().then(function () {
            return bs.reload();
          });
        }

        var file = cache.get('files', changedPath);
        var consumers = [];
        var assets = [];
        var reloadTargets = [];
        var shouldMake = false;
        var shouldMakeAll = false;

        if (['asset', 'import', 'wrapper'].includes(file.role)) {
          var deps = _(cache.get('deps')).filter({ srcResolved: changedPath }).map(function (dep) {
            return cache.get('files', dep.consumer);
          }).uniq().value();

          consumers.push.apply(consumers, _toConsumableArray(deps));
        }

        if (file.role === 'asset') {
          assets.push(file);
          var assetConsumers = _.filter(consumers, { role: 'asset' });
          assets.push.apply(assets, _toConsumableArray(assetConsumers));
          reloadTargets.push(file.destResolved);
          reloadTargets.push.apply(reloadTargets, _toConsumableArray(_.map(assetConsumers, 'destResolved')));
          shouldMake = true;
        }

        if (file.role === 'import') {
          var _assetConsumers = _.filter(consumers, { role: 'asset' });
          assets.push.apply(assets, _toConsumableArray(_assetConsumers));
          reloadTargets.push.apply(reloadTargets, _toConsumableArray(_.map(_assetConsumers, 'destResolved')));
          shouldMake = true;
        }

        if (file.role === 'data') {
          shouldMakeAll = true;
        }

        if (file.role === 'template') {
          plugins.static(file);
        }

        if (file.role === 'wrapper') {
          var templates = _.filter(consumers, { role: 'template' });
          templates.forEach(plugins.static);
        }

        if (shouldMakeAll) {
          make().then(function () {
            return bs.reload();
          });
        } else if (shouldMake) {
          make({ assets: assets, targeted: true }).then(function () {
            return bs.reload(reloadTargets);
          });
        } else {
          bs.reload();
        }
      });
    })();
  }

  var bsOpts = {
    server: {
      baseDir: config.serveRoot,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    notify: false,
    ghostMode: false
  };

  bs.init(bsOpts);
}