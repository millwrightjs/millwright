'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var path = require('path');
var _ = require('lodash');
var chokidar = require('chokidar');
var bs = require('browser-sync').create();
var logger = require('connect-logger');
var historyApiFallback = require('connect-history-api-fallback');
var config = require('../config');
var cache = require('../utils/cache');
var make = require('./make');
var requireDir = require('require-dir');
var plugins = requireDir('../plugins', { camelcase: true });

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

        if (_.includes(['asset', 'import', 'wrapper'], file.role)) {
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
        } else if (file.role === 'import') {
          var _assetConsumers = _.filter(consumers, { role: 'asset' });
          assets.push.apply(assets, _toConsumableArray(_assetConsumers));
          reloadTargets.push.apply(reloadTargets, _toConsumableArray(_.map(_assetConsumers, 'destResolved')));
          shouldMake = true;
        } else if (file.role === 'data') {
          shouldMakeAll = true;
        } else if (file.role === 'template') {
          plugins.static(file);
        } else if (file.role === 'wrapper') {
          var templates = _.filter(consumers, { role: 'template' });
          templates.forEach(plugins.static);
        } else if (_.includes(['partial', 'lambda'], file.role)) {
          (function () {
            var opts = {
              shouldGetPartials: file.role === 'partial',
              shouldGetLambdas: file.role === 'lambda'
            };
            var templates = _.filter(cache.get('files'), { role: 'template' });
            templates.forEach(function (template) {
              return plugins.static(template, opts);
            });
          })();
        } else {
          shouldMakeAll = true;
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

  var bsMiddleware = [logger()];

  if (config.spaRouting) {
    bsMiddleware.push(historyApiFallback());
  }

  var bsOpts = {
    server: {
      baseDir: config.destDir,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    middleware: bsMiddleware,
    snippetOptions: {
      rule: {
        match: /$/,
        fn: function fn(snippet) {
          return snippet;
        }
      }
    },
    notify: false,
    ghostMode: false
  };

  bs.init(bsOpts);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9zZXJ2ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJjaG9raWRhciIsImJzIiwiY3JlYXRlIiwibG9nZ2VyIiwiaGlzdG9yeUFwaUZhbGxiYWNrIiwiY29uZmlnIiwiY2FjaGUiLCJtYWtlIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VydmUiLCJwcm9jZXNzIiwiZW52IiwidGFzayIsInNyY0RpclJlc29sdmVkIiwicmVzb2x2ZSIsInNyY0RpciIsImFib3ZlU3JjUGF0aHMiLCJnZXQiLCJrZXlzIiwiY29uY2F0IiwibWFwIiwiZmlsdGVyIiwic3JjUmVzb2x2ZWQiLCJzdGFydHNXaXRoIiwidW5pcSIsInZhbHVlIiwid2F0Y2hPcHRzIiwiaWdub3JlSW5pdGlhbCIsIndhdGNoIiwib24iLCJldmVudCIsImNoYW5nZWRQYXRoIiwidGhlbiIsInJlbG9hZCIsImZpbGUiLCJjb25zdW1lcnMiLCJhc3NldHMiLCJyZWxvYWRUYXJnZXRzIiwic2hvdWxkTWFrZSIsInNob3VsZE1ha2VBbGwiLCJpbmNsdWRlcyIsInJvbGUiLCJkZXBzIiwiZGVwIiwiY29uc3VtZXIiLCJwdXNoIiwiYXNzZXRDb25zdW1lcnMiLCJkZXN0UmVzb2x2ZWQiLCJzdGF0aWMiLCJ0ZW1wbGF0ZXMiLCJmb3JFYWNoIiwib3B0cyIsInNob3VsZEdldFBhcnRpYWxzIiwic2hvdWxkR2V0TGFtYmRhcyIsInRlbXBsYXRlIiwidGFyZ2V0ZWQiLCJic01pZGRsZXdhcmUiLCJzcGFSb3V0aW5nIiwiYnNPcHRzIiwic2VydmVyIiwiYmFzZURpciIsImRlc3REaXIiLCJzZXJ2ZVN0YXRpY09wdGlvbnMiLCJleHRlbnNpb25zIiwibWlkZGxld2FyZSIsInNuaXBwZXRPcHRpb25zIiwicnVsZSIsIm1hdGNoIiwiZm4iLCJzbmlwcGV0Iiwibm90aWZ5IiwiZ2hvc3RNb2RlIiwiaW5pdCJdLCJt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SCxDQUFRZCxNQUFSO0FBQ0QiLCJmaWxlIjoic2VydmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgY2hva2lkYXIgPSByZXF1aXJlKCdjaG9raWRhcicpO1xuY29uc3QgYnMgPSByZXF1aXJlKCdicm93c2VyLXN5bmMnKS5jcmVhdGUoKTtcbmNvbnN0IGxvZ2dlciA9IHJlcXVpcmUoJ2Nvbm5lY3QtbG9nZ2VyJyk7XG5jb25zdCBoaXN0b3J5QXBpRmFsbGJhY2sgPSByZXF1aXJlKCdjb25uZWN0LWhpc3RvcnktYXBpLWZhbGxiYWNrJyk7XG5jb25zdCBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcbmNvbnN0IGNhY2hlID0gcmVxdWlyZSAoJy4uL3V0aWxzL2NhY2hlJyk7XG5jb25zdCBtYWtlID0gcmVxdWlyZSgnLi9tYWtlJyk7XG5jb25zdCByZXF1aXJlRGlyID0gcmVxdWlyZSgncmVxdWlyZS1kaXInKTtcbmNvbnN0IHBsdWdpbnMgPSByZXF1aXJlRGlyKCcuLi9wbHVnaW5zJywge2NhbWVsY2FzZTogdHJ1ZX0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlcnZlO1xuXG5mdW5jdGlvbiBzZXJ2ZSgpIHtcbiAgaWYgKHByb2Nlc3MuZW52LnRhc2sgIT09ICdidWlsZCcpIHtcblxuICAgIGNvbnN0IHNyY0RpclJlc29sdmVkID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5zcmNEaXIpO1xuXG4gICAgY29uc3QgYWJvdmVTcmNQYXRocyA9IF8oY2FjaGUuZ2V0KCdmaWxlcycpKVxuICAgICAgLmtleXMoKVxuICAgICAgLmNvbmNhdChfLm1hcChjYWNoZS5nZXQoJ2RlcHMnKSwgJ3NyY1Jlc29sdmVkJykpXG4gICAgICAuZmlsdGVyKHNyY1Jlc29sdmVkID0+ICFzcmNSZXNvbHZlZC5zdGFydHNXaXRoKHNyY0RpclJlc29sdmVkKSlcbiAgICAgIC51bmlxKClcbiAgICAgIC52YWx1ZSgpO1xuXG4gICAgY29uc3Qgd2F0Y2hPcHRzID0ge1xuICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZVxuICAgIH07XG5cbiAgICBjaG9raWRhci53YXRjaChbc3JjRGlyUmVzb2x2ZWQsIC4uLmFib3ZlU3JjUGF0aHNdLCB3YXRjaE9wdHMpLm9uKCdhbGwnLCAoZXZlbnQsIGNoYW5nZWRQYXRoKSA9PiB7XG4gICAgICBpZiAoZXZlbnQgIT09ICdjaGFuZ2UnKSB7XG4gICAgICAgIHJldHVybiBtYWtlKCkudGhlbigoKSA9PiBicy5yZWxvYWQoKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGUgPSBjYWNoZS5nZXQoJ2ZpbGVzJywgY2hhbmdlZFBhdGgpO1xuICAgICAgY29uc3QgY29uc3VtZXJzID0gW107XG4gICAgICBjb25zdCBhc3NldHMgPSBbXTtcbiAgICAgIGNvbnN0IHJlbG9hZFRhcmdldHMgPSBbXTtcbiAgICAgIHZhciBzaG91bGRNYWtlID0gZmFsc2U7XG4gICAgICB2YXIgc2hvdWxkTWFrZUFsbCA9IGZhbHNlO1xuXG4gICAgICBpZiAoXy5pbmNsdWRlcyhbJ2Fzc2V0JywgJ2ltcG9ydCcsICd3cmFwcGVyJ10sIGZpbGUucm9sZSkpIHtcbiAgICAgICAgY29uc3QgZGVwcyA9IF8oY2FjaGUuZ2V0KCdkZXBzJykpXG4gICAgICAgICAgLmZpbHRlcih7c3JjUmVzb2x2ZWQ6IGNoYW5nZWRQYXRofSlcbiAgICAgICAgICAubWFwKGRlcCA9PiBjYWNoZS5nZXQoJ2ZpbGVzJywgZGVwLmNvbnN1bWVyKSlcbiAgICAgICAgICAudW5pcSgpXG4gICAgICAgICAgLnZhbHVlKCk7XG5cbiAgICAgICAgY29uc3VtZXJzLnB1c2goLi4uZGVwcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWxlLnJvbGUgPT09ICdhc3NldCcpIHtcbiAgICAgICAgYXNzZXRzLnB1c2goZmlsZSk7XG4gICAgICAgIGNvbnN0IGFzc2V0Q29uc3VtZXJzID0gXy5maWx0ZXIoY29uc3VtZXJzLCB7cm9sZTogJ2Fzc2V0J30pO1xuICAgICAgICBhc3NldHMucHVzaCguLi5hc3NldENvbnN1bWVycyk7XG4gICAgICAgIHJlbG9hZFRhcmdldHMucHVzaChmaWxlLmRlc3RSZXNvbHZlZCk7XG4gICAgICAgIHJlbG9hZFRhcmdldHMucHVzaCguLi5fLm1hcChhc3NldENvbnN1bWVycywgJ2Rlc3RSZXNvbHZlZCcpKTtcbiAgICAgICAgc2hvdWxkTWFrZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ2ltcG9ydCcpIHtcbiAgICAgICAgY29uc3QgYXNzZXRDb25zdW1lcnMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAnYXNzZXQnfSk7XG4gICAgICAgIGFzc2V0cy5wdXNoKC4uLmFzc2V0Q29uc3VtZXJzKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKC4uLl8ubWFwKGFzc2V0Q29uc3VtZXJzLCAnZGVzdFJlc29sdmVkJykpO1xuICAgICAgICBzaG91bGRNYWtlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnZGF0YScpIHtcbiAgICAgICAgc2hvdWxkTWFrZUFsbCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ3RlbXBsYXRlJykge1xuICAgICAgICBwbHVnaW5zLnN0YXRpYyhmaWxlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnd3JhcHBlcicpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVzID0gXy5maWx0ZXIoY29uc3VtZXJzLCB7cm9sZTogJ3RlbXBsYXRlJ30pO1xuICAgICAgICB0ZW1wbGF0ZXMuZm9yRWFjaChwbHVnaW5zLnN0YXRpYyk7XG4gICAgICB9IGVsc2UgaWYgKF8uaW5jbHVkZXMoWydwYXJ0aWFsJywgJ2xhbWJkYSddLCBmaWxlLnJvbGUpKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgICAgc2hvdWxkR2V0UGFydGlhbHM6IGZpbGUucm9sZSA9PT0gJ3BhcnRpYWwnLFxuICAgICAgICAgIHNob3VsZEdldExhbWJkYXM6IGZpbGUucm9sZSA9PT0gJ2xhbWJkYSdcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVzID0gXy5maWx0ZXIoY2FjaGUuZ2V0KCdmaWxlcycpLCB7cm9sZTogJ3RlbXBsYXRlJ30pO1xuICAgICAgICB0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiBwbHVnaW5zLnN0YXRpYyh0ZW1wbGF0ZSwgb3B0cykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvdWxkTWFrZUFsbCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRNYWtlQWxsKSB7XG4gICAgICAgIG1ha2UoKS50aGVuKCgpID0+IGJzLnJlbG9hZCgpKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkTWFrZSkge1xuICAgICAgICBtYWtlKHthc3NldHMsIHRhcmdldGVkOiB0cnVlfSkudGhlbigoKSA9PiBicy5yZWxvYWQocmVsb2FkVGFyZ2V0cykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnMucmVsb2FkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBic01pZGRsZXdhcmUgPSBbbG9nZ2VyKCldO1xuXG4gIGlmIChjb25maWcuc3BhUm91dGluZykge1xuICAgIGJzTWlkZGxld2FyZS5wdXNoKGhpc3RvcnlBcGlGYWxsYmFjaygpKTtcbiAgfVxuXG4gIGNvbnN0IGJzT3B0cyA9IHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGJhc2VEaXI6IGNvbmZpZy5kZXN0RGlyLFxuICAgICAgc2VydmVTdGF0aWNPcHRpb25zOiB7XG4gICAgICAgIGV4dGVuc2lvbnM6IFsnaHRtbCddXG4gICAgICB9XG4gICAgfSxcbiAgICBtaWRkbGV3YXJlOiBic01pZGRsZXdhcmUsXG4gICAgc25pcHBldE9wdGlvbnM6IHtcbiAgICAgIHJ1bGU6IHtcbiAgICAgICAgbWF0Y2g6IC8kLyxcbiAgICAgICAgZm46IGZ1bmN0aW9uIChzbmlwcGV0KSB7XG4gICAgICAgICAgcmV0dXJuIHNuaXBwZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG5vdGlmeTogZmFsc2UsXG4gICAgZ2hvc3RNb2RlOiBmYWxzZVxuICB9O1xuXG4gIGJzLmluaXQoYnNPcHRzKTtcbn1cbiJdfQ==