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
        var opts = {
          shouldGetPartials: file.role === 'partial',
          shouldGetLambdas: file.role === 'lambda'
        };
        var _templates = _.filter(cache.get('files'), { role: 'template' });
        _templates.forEach(function (template) {
          return plugins.static(template, opts);
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9zZXJ2ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJjaG9raWRhciIsImJzIiwiY3JlYXRlIiwibG9nZ2VyIiwiaGlzdG9yeUFwaUZhbGxiYWNrIiwiY29uZmlnIiwiY2FjaGUiLCJtYWtlIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VydmUiLCJwcm9jZXNzIiwiZW52IiwidGFzayIsInNyY0RpclJlc29sdmVkIiwicmVzb2x2ZSIsInNyY0RpciIsImFib3ZlU3JjUGF0aHMiLCJnZXQiLCJrZXlzIiwiY29uY2F0IiwibWFwIiwiZmlsdGVyIiwic3JjUmVzb2x2ZWQiLCJzdGFydHNXaXRoIiwidW5pcSIsInZhbHVlIiwid2F0Y2hPcHRzIiwiaWdub3JlSW5pdGlhbCIsIndhdGNoIiwib24iLCJldmVudCIsImNoYW5nZWRQYXRoIiwidGhlbiIsInJlbG9hZCIsImZpbGUiLCJjb25zdW1lcnMiLCJhc3NldHMiLCJyZWxvYWRUYXJnZXRzIiwic2hvdWxkTWFrZSIsInNob3VsZE1ha2VBbGwiLCJpbmNsdWRlcyIsInJvbGUiLCJkZXBzIiwiZGVwIiwiY29uc3VtZXIiLCJwdXNoIiwiYXNzZXRDb25zdW1lcnMiLCJkZXN0UmVzb2x2ZWQiLCJzdGF0aWMiLCJ0ZW1wbGF0ZXMiLCJmb3JFYWNoIiwib3B0cyIsInNob3VsZEdldFBhcnRpYWxzIiwic2hvdWxkR2V0TGFtYmRhcyIsInRlbXBsYXRlIiwidGFyZ2V0ZWQiLCJic01pZGRsZXdhcmUiLCJzcGFSb3V0aW5nIiwiYnNPcHRzIiwic2VydmVyIiwiYmFzZURpciIsImRlc3REaXIiLCJzZXJ2ZVN0YXRpY09wdGlvbnMiLCJleHRlbnNpb25zIiwibWlkZGxld2FyZSIsInNuaXBwZXRPcHRpb25zIiwicnVsZSIsIm1hdGNoIiwiZm4iLCJzbmlwcGV0Iiwibm90aWZ5IiwiZ2hvc3RNb2RlIiwiaW5pdCJdLCJt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ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjaG9raWRhciA9IHJlcXVpcmUoJ2Nob2tpZGFyJyk7XG5jb25zdCBicyA9IHJlcXVpcmUoJ2Jyb3dzZXItc3luYycpLmNyZWF0ZSgpO1xuY29uc3QgbG9nZ2VyID0gcmVxdWlyZSgnY29ubmVjdC1sb2dnZXInKTtcbmNvbnN0IGhpc3RvcnlBcGlGYWxsYmFjayA9IHJlcXVpcmUoJ2Nvbm5lY3QtaGlzdG9yeS1hcGktZmFsbGJhY2snKTtcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuY29uc3QgY2FjaGUgPSByZXF1aXJlICgnLi4vdXRpbHMvY2FjaGUnKTtcbmNvbnN0IG1ha2UgPSByZXF1aXJlKCcuL21ha2UnKTtcbmNvbnN0IHJlcXVpcmVEaXIgPSByZXF1aXJlKCdyZXF1aXJlLWRpcicpO1xuY29uc3QgcGx1Z2lucyA9IHJlcXVpcmVEaXIoJy4uL3BsdWdpbnMnLCB7Y2FtZWxjYXNlOiB0cnVlfSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2VydmU7XG5cbmZ1bmN0aW9uIHNlcnZlKCkge1xuICBpZiAocHJvY2Vzcy5lbnYudGFzayAhPT0gJ2J1aWxkJykge1xuXG4gICAgY29uc3Qgc3JjRGlyUmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoY29uZmlnLnNyY0Rpcik7XG5cbiAgICBjb25zdCBhYm92ZVNyY1BhdGhzID0gXyhjYWNoZS5nZXQoJ2ZpbGVzJykpXG4gICAgICAua2V5cygpXG4gICAgICAuY29uY2F0KF8ubWFwKGNhY2hlLmdldCgnZGVwcycpLCAnc3JjUmVzb2x2ZWQnKSlcbiAgICAgIC5maWx0ZXIoc3JjUmVzb2x2ZWQgPT4gIXNyY1Jlc29sdmVkLnN0YXJ0c1dpdGgoc3JjRGlyUmVzb2x2ZWQpKVxuICAgICAgLnVuaXEoKVxuICAgICAgLnZhbHVlKCk7XG5cbiAgICBjb25zdCB3YXRjaE9wdHMgPSB7XG4gICAgICBpZ25vcmVJbml0aWFsOiB0cnVlXG4gICAgfTtcblxuICAgIGNob2tpZGFyLndhdGNoKFtzcmNEaXJSZXNvbHZlZCwgLi4uYWJvdmVTcmNQYXRoc10sIHdhdGNoT3B0cykub24oJ2FsbCcsIChldmVudCwgY2hhbmdlZFBhdGgpID0+IHtcbiAgICAgIGlmIChldmVudCAhPT0gJ2NoYW5nZScpIHtcbiAgICAgICAgcmV0dXJuIG1ha2UoKS50aGVuKCgpID0+IGJzLnJlbG9hZCgpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZSA9IGNhY2hlLmdldCgnZmlsZXMnLCBjaGFuZ2VkUGF0aCk7XG4gICAgICBjb25zdCBjb25zdW1lcnMgPSBbXTtcbiAgICAgIGNvbnN0IGFzc2V0cyA9IFtdO1xuICAgICAgY29uc3QgcmVsb2FkVGFyZ2V0cyA9IFtdO1xuICAgICAgdmFyIHNob3VsZE1ha2UgPSBmYWxzZTtcbiAgICAgIHZhciBzaG91bGRNYWtlQWxsID0gZmFsc2U7XG5cbiAgICAgIGlmIChfLmluY2x1ZGVzKFsnYXNzZXQnLCAnaW1wb3J0JywgJ3dyYXBwZXInXSwgZmlsZS5yb2xlKSkge1xuICAgICAgICBjb25zdCBkZXBzID0gXyhjYWNoZS5nZXQoJ2RlcHMnKSlcbiAgICAgICAgICAuZmlsdGVyKHtzcmNSZXNvbHZlZDogY2hhbmdlZFBhdGh9KVxuICAgICAgICAgIC5tYXAoZGVwID0+IGNhY2hlLmdldCgnZmlsZXMnLCBkZXAuY29uc3VtZXIpKVxuICAgICAgICAgIC51bmlxKClcbiAgICAgICAgICAudmFsdWUoKTtcblxuICAgICAgICBjb25zdW1lcnMucHVzaCguLi5kZXBzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGUucm9sZSA9PT0gJ2Fzc2V0Jykge1xuICAgICAgICBhc3NldHMucHVzaChmaWxlKTtcbiAgICAgICAgY29uc3QgYXNzZXRDb25zdW1lcnMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAnYXNzZXQnfSk7XG4gICAgICAgIGFzc2V0cy5wdXNoKC4uLmFzc2V0Q29uc3VtZXJzKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKGZpbGUuZGVzdFJlc29sdmVkKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKC4uLl8ubWFwKGFzc2V0Q29uc3VtZXJzLCAnZGVzdFJlc29sdmVkJykpO1xuICAgICAgICBzaG91bGRNYWtlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnaW1wb3J0Jykge1xuICAgICAgICBjb25zdCBhc3NldENvbnN1bWVycyA9IF8uZmlsdGVyKGNvbnN1bWVycywge3JvbGU6ICdhc3NldCd9KTtcbiAgICAgICAgYXNzZXRzLnB1c2goLi4uYXNzZXRDb25zdW1lcnMpO1xuICAgICAgICByZWxvYWRUYXJnZXRzLnB1c2goLi4uXy5tYXAoYXNzZXRDb25zdW1lcnMsICdkZXN0UmVzb2x2ZWQnKSk7XG4gICAgICAgIHNob3VsZE1ha2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICdkYXRhJykge1xuICAgICAgICBzaG91bGRNYWtlQWxsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgIHBsdWdpbnMuc3RhdGljKGZpbGUpO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICd3cmFwcGVyJykge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZXMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAndGVtcGxhdGUnfSk7XG4gICAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKHBsdWdpbnMuc3RhdGljKTtcbiAgICAgIH0gZWxzZSBpZiAoXy5pbmNsdWRlcyhbJ3BhcnRpYWwnLCAnbGFtYmRhJ10sIGZpbGUucm9sZSkpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgICBzaG91bGRHZXRQYXJ0aWFsczogZmlsZS5yb2xlID09PSAncGFydGlhbCcsXG4gICAgICAgICAgc2hvdWxkR2V0TGFtYmRhczogZmlsZS5yb2xlID09PSAnbGFtYmRhJ1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZXMgPSBfLmZpbHRlcihjYWNoZS5nZXQoJ2ZpbGVzJyksIHtyb2xlOiAndGVtcGxhdGUnfSk7XG4gICAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHBsdWdpbnMuc3RhdGljKHRlbXBsYXRlLCBvcHRzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG91bGRNYWtlQWxsID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNob3VsZE1ha2VBbGwpIHtcbiAgICAgICAgbWFrZSgpLnRoZW4oKCkgPT4gYnMucmVsb2FkKCkpO1xuICAgICAgfSBlbHNlIGlmIChzaG91bGRNYWtlKSB7XG4gICAgICAgIG1ha2Uoe2Fzc2V0cywgdGFyZ2V0ZWQ6IHRydWV9KS50aGVuKCgpID0+IGJzLnJlbG9hZChyZWxvYWRUYXJnZXRzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicy5yZWxvYWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGJzTWlkZGxld2FyZSA9IFtsb2dnZXIoKV07XG5cbiAgaWYgKGNvbmZpZy5zcGFSb3V0aW5nKSB7XG4gICAgYnNNaWRkbGV3YXJlLnB1c2goaGlzdG9yeUFwaUZhbGxiYWNrKCkpO1xuICB9XG5cbiAgY29uc3QgYnNPcHRzID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgYmFzZURpcjogY29uZmlnLmRlc3REaXIsXG4gICAgICBzZXJ2ZVN0YXRpY09wdGlvbnM6IHtcbiAgICAgICAgZXh0ZW5zaW9uczogWydodG1sJ11cbiAgICAgIH1cbiAgICB9LFxuICAgIG1pZGRsZXdhcmU6IGJzTWlkZGxld2FyZSxcbiAgICBzbmlwcGV0T3B0aW9uczoge1xuICAgICAgcnVsZToge1xuICAgICAgICBtYXRjaDogLyQvLFxuICAgICAgICBmbjogZnVuY3Rpb24gKHNuaXBwZXQpIHtcbiAgICAgICAgICByZXR1cm4gc25pcHBldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgbm90aWZ5OiBmYWxzZSxcbiAgICBnaG9zdE1vZGU6IGZhbHNlXG4gIH07XG5cbiAgYnMuaW5pdChic09wdHMpO1xufVxuIl19