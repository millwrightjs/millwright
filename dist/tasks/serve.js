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

  var bsOpts = {
    server: {
      baseDir: config.destDir,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    middleware: [logger()],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9zZXJ2ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJjaG9raWRhciIsImJzIiwiY3JlYXRlIiwibG9nZ2VyIiwiaGlzdG9yeUFwaUZhbGxiYWNrIiwiY29uZmlnIiwiY2FjaGUiLCJtYWtlIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VydmUiLCJwcm9jZXNzIiwiZW52IiwidGFzayIsInNyY0RpclJlc29sdmVkIiwicmVzb2x2ZSIsInNyY0RpciIsImFib3ZlU3JjUGF0aHMiLCJnZXQiLCJrZXlzIiwiY29uY2F0IiwibWFwIiwiZmlsdGVyIiwic3JjUmVzb2x2ZWQiLCJzdGFydHNXaXRoIiwidW5pcSIsInZhbHVlIiwid2F0Y2hPcHRzIiwiaWdub3JlSW5pdGlhbCIsIndhdGNoIiwib24iLCJldmVudCIsImNoYW5nZWRQYXRoIiwidGhlbiIsInJlbG9hZCIsImZpbGUiLCJjb25zdW1lcnMiLCJhc3NldHMiLCJyZWxvYWRUYXJnZXRzIiwic2hvdWxkTWFrZSIsInNob3VsZE1ha2VBbGwiLCJpbmNsdWRlcyIsInJvbGUiLCJkZXBzIiwiZGVwIiwiY29uc3VtZXIiLCJwdXNoIiwiYXNzZXRDb25zdW1lcnMiLCJkZXN0UmVzb2x2ZWQiLCJzdGF0aWMiLCJ0ZW1wbGF0ZXMiLCJmb3JFYWNoIiwib3B0cyIsInNob3VsZEdldFBhcnRpYWxzIiwic2hvdWxkR2V0TGFtYmRhcyIsInRlbXBsYXRlIiwidGFyZ2V0ZWQiLCJic09wdHMiLCJzZXJ2ZXIiLCJiYXNlRGlyIiwiZGVzdERpciIsInNlcnZlU3RhdGljT3B0aW9ucyIsImV4dGVuc2lvbnMiLCJtaWRkbGV3YXJlIiwic25pcHBldE9wdGlvbnMiLCJydWxlIiwibWF0Y2giLCJmbiIsInNuaXBwZXQiLCJub3RpZnkiLCJnaG9zdE1vZGUiLCJpbml0Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBTUEsT0FB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QUFULEVBQTZCLEVBQUN3QixNQUFNLFVBQVAsRUFBN0IsQ0FBbEI7QUFDQVEsc0JBQVVDLE9BQVYsQ0FBa0I7QUFBQSxxQkFBWTdDLFFBQVEyQyxNQUFSLENBQWVNLFFBQWYsRUFBeUJILElBQXpCLENBQVo7QUFBQSxhQUFsQjtBQU51RDtBQU94RCxTQVBNLE1BT0E7QUFDTFosMEJBQWdCLElBQWhCO0FBQ0Q7O0FBRUQsWUFBSUEsYUFBSixFQUFtQjtBQUNqQnBDLGlCQUFPNkIsSUFBUCxDQUFZO0FBQUEsbUJBQU1uQyxHQUFHb0MsTUFBSCxFQUFOO0FBQUEsV0FBWjtBQUNELFNBRkQsTUFFTyxJQUFJSyxVQUFKLEVBQWdCO0FBQ3JCbkMsZUFBSyxFQUFDaUMsY0FBRCxFQUFTbUIsVUFBVSxJQUFuQixFQUFMLEVBQStCdkIsSUFBL0IsQ0FBb0M7QUFBQSxtQkFBTW5DLEdBQUdvQyxNQUFILENBQVVJLGFBQVYsQ0FBTjtBQUFBLFdBQXBDO0FBQ0QsU0FGTSxNQUVBO0FBQ0x4QyxhQUFHb0MsTUFBSDtBQUNEO0FBQ0YsT0EzREQ7QUFmZ0M7QUEyRWpDOztBQUVELE1BQU11QixTQUFTO0FBQ2JDLFlBQVE7QUFDTkMsZUFBU3pELE9BQU8wRCxPQURWO0FBRU5DLDBCQUFvQjtBQUNsQkMsb0JBQVksQ0FBQyxNQUFEO0FBRE07QUFGZCxLQURLO0FBT2JDLGdCQUFZLENBQ1YvRCxRQURVLENBUEM7QUFVYmdFLG9CQUFnQjtBQUNkQyxZQUFNO0FBQ0pDLGVBQU8sR0FESDtBQUVKQyxZQUFJLFlBQVVDLE9BQVYsRUFBbUI7QUFDckIsaUJBQU9BLE9BQVA7QUFDRDtBQUpHO0FBRFEsS0FWSDtBQWtCYkMsWUFBUSxLQWxCSztBQW1CYkMsZUFBVztBQW5CRSxHQUFmOztBQXNCQXhFLEtBQUd5RSxJQUFILENBQVFkLE1BQVI7QUFDRCIsImZpbGUiOiJzZXJ2ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjaG9raWRhciA9IHJlcXVpcmUoJ2Nob2tpZGFyJyk7XG5jb25zdCBicyA9IHJlcXVpcmUoJ2Jyb3dzZXItc3luYycpLmNyZWF0ZSgpO1xuY29uc3QgbG9nZ2VyID0gcmVxdWlyZSgnY29ubmVjdC1sb2dnZXInKTtcbmNvbnN0IGhpc3RvcnlBcGlGYWxsYmFjayA9IHJlcXVpcmUoJ2Nvbm5lY3QtaGlzdG9yeS1hcGktZmFsbGJhY2snKTtcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuY29uc3QgY2FjaGUgPSByZXF1aXJlICgnLi4vdXRpbHMvY2FjaGUnKTtcbmNvbnN0IG1ha2UgPSByZXF1aXJlKCcuL21ha2UnKTtcbmNvbnN0IHJlcXVpcmVEaXIgPSByZXF1aXJlKCdyZXF1aXJlLWRpcicpO1xuY29uc3QgcGx1Z2lucyA9IHJlcXVpcmVEaXIoJy4uL3BsdWdpbnMnLCB7Y2FtZWxjYXNlOiB0cnVlfSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2VydmU7XG5cbmZ1bmN0aW9uIHNlcnZlKCkge1xuICBpZiAocHJvY2Vzcy5lbnYudGFzayAhPT0gJ2J1aWxkJykge1xuXG4gICAgY29uc3Qgc3JjRGlyUmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoY29uZmlnLnNyY0Rpcik7XG5cbiAgICBjb25zdCBhYm92ZVNyY1BhdGhzID0gXyhjYWNoZS5nZXQoJ2ZpbGVzJykpXG4gICAgICAua2V5cygpXG4gICAgICAuY29uY2F0KF8ubWFwKGNhY2hlLmdldCgnZGVwcycpLCAnc3JjUmVzb2x2ZWQnKSlcbiAgICAgIC5maWx0ZXIoc3JjUmVzb2x2ZWQgPT4gIXNyY1Jlc29sdmVkLnN0YXJ0c1dpdGgoc3JjRGlyUmVzb2x2ZWQpKVxuICAgICAgLnVuaXEoKVxuICAgICAgLnZhbHVlKCk7XG5cbiAgICBjb25zdCB3YXRjaE9wdHMgPSB7XG4gICAgICBpZ25vcmVJbml0aWFsOiB0cnVlXG4gICAgfTtcblxuICAgIGNob2tpZGFyLndhdGNoKFtzcmNEaXJSZXNvbHZlZCwgLi4uYWJvdmVTcmNQYXRoc10sIHdhdGNoT3B0cykub24oJ2FsbCcsIChldmVudCwgY2hhbmdlZFBhdGgpID0+IHtcbiAgICAgIGlmIChldmVudCAhPT0gJ2NoYW5nZScpIHtcbiAgICAgICAgcmV0dXJuIG1ha2UoKS50aGVuKCgpID0+IGJzLnJlbG9hZCgpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZSA9IGNhY2hlLmdldCgnZmlsZXMnLCBjaGFuZ2VkUGF0aCk7XG4gICAgICBjb25zdCBjb25zdW1lcnMgPSBbXTtcbiAgICAgIGNvbnN0IGFzc2V0cyA9IFtdO1xuICAgICAgY29uc3QgcmVsb2FkVGFyZ2V0cyA9IFtdO1xuICAgICAgdmFyIHNob3VsZE1ha2UgPSBmYWxzZTtcbiAgICAgIHZhciBzaG91bGRNYWtlQWxsID0gZmFsc2U7XG5cbiAgICAgIGlmIChfLmluY2x1ZGVzKFsnYXNzZXQnLCAnaW1wb3J0JywgJ3dyYXBwZXInXSwgZmlsZS5yb2xlKSkge1xuICAgICAgICBjb25zdCBkZXBzID0gXyhjYWNoZS5nZXQoJ2RlcHMnKSlcbiAgICAgICAgICAuZmlsdGVyKHtzcmNSZXNvbHZlZDogY2hhbmdlZFBhdGh9KVxuICAgICAgICAgIC5tYXAoZGVwID0+IGNhY2hlLmdldCgnZmlsZXMnLCBkZXAuY29uc3VtZXIpKVxuICAgICAgICAgIC51bmlxKClcbiAgICAgICAgICAudmFsdWUoKTtcblxuICAgICAgICBjb25zdW1lcnMucHVzaCguLi5kZXBzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGUucm9sZSA9PT0gJ2Fzc2V0Jykge1xuICAgICAgICBhc3NldHMucHVzaChmaWxlKTtcbiAgICAgICAgY29uc3QgYXNzZXRDb25zdW1lcnMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAnYXNzZXQnfSk7XG4gICAgICAgIGFzc2V0cy5wdXNoKC4uLmFzc2V0Q29uc3VtZXJzKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKGZpbGUuZGVzdFJlc29sdmVkKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKC4uLl8ubWFwKGFzc2V0Q29uc3VtZXJzLCAnZGVzdFJlc29sdmVkJykpO1xuICAgICAgICBzaG91bGRNYWtlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnaW1wb3J0Jykge1xuICAgICAgICBjb25zdCBhc3NldENvbnN1bWVycyA9IF8uZmlsdGVyKGNvbnN1bWVycywge3JvbGU6ICdhc3NldCd9KTtcbiAgICAgICAgYXNzZXRzLnB1c2goLi4uYXNzZXRDb25zdW1lcnMpO1xuICAgICAgICByZWxvYWRUYXJnZXRzLnB1c2goLi4uXy5tYXAoYXNzZXRDb25zdW1lcnMsICdkZXN0UmVzb2x2ZWQnKSk7XG4gICAgICAgIHNob3VsZE1ha2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICdkYXRhJykge1xuICAgICAgICBzaG91bGRNYWtlQWxsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgIHBsdWdpbnMuc3RhdGljKGZpbGUpO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICd3cmFwcGVyJykge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZXMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAndGVtcGxhdGUnfSk7XG4gICAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKHBsdWdpbnMuc3RhdGljKTtcbiAgICAgIH0gZWxzZSBpZiAoXy5pbmNsdWRlcyhbJ3BhcnRpYWwnLCAnbGFtYmRhJ10sIGZpbGUucm9sZSkpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgICBzaG91bGRHZXRQYXJ0aWFsczogZmlsZS5yb2xlID09PSAncGFydGlhbCcsXG4gICAgICAgICAgc2hvdWxkR2V0TGFtYmRhczogZmlsZS5yb2xlID09PSAnbGFtYmRhJ1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZXMgPSBfLmZpbHRlcihjYWNoZS5nZXQoJ2ZpbGVzJyksIHtyb2xlOiAndGVtcGxhdGUnfSk7XG4gICAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHBsdWdpbnMuc3RhdGljKHRlbXBsYXRlLCBvcHRzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG91bGRNYWtlQWxsID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNob3VsZE1ha2VBbGwpIHtcbiAgICAgICAgbWFrZSgpLnRoZW4oKCkgPT4gYnMucmVsb2FkKCkpO1xuICAgICAgfSBlbHNlIGlmIChzaG91bGRNYWtlKSB7XG4gICAgICAgIG1ha2Uoe2Fzc2V0cywgdGFyZ2V0ZWQ6IHRydWV9KS50aGVuKCgpID0+IGJzLnJlbG9hZChyZWxvYWRUYXJnZXRzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicy5yZWxvYWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGJzT3B0cyA9IHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGJhc2VEaXI6IGNvbmZpZy5kZXN0RGlyLFxuICAgICAgc2VydmVTdGF0aWNPcHRpb25zOiB7XG4gICAgICAgIGV4dGVuc2lvbnM6IFsnaHRtbCddXG4gICAgICB9XG4gICAgfSxcbiAgICBtaWRkbGV3YXJlOiBbXG4gICAgICBsb2dnZXIoKVxuICAgIF0sXG4gICAgc25pcHBldE9wdGlvbnM6IHtcbiAgICAgIHJ1bGU6IHtcbiAgICAgICAgbWF0Y2g6IC8kLyxcbiAgICAgICAgZm46IGZ1bmN0aW9uIChzbmlwcGV0KSB7XG4gICAgICAgICAgcmV0dXJuIHNuaXBwZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG5vdGlmeTogZmFsc2UsXG4gICAgZ2hvc3RNb2RlOiBmYWxzZVxuICB9O1xuXG4gIGJzLmluaXQoYnNPcHRzKTtcbn1cbiJdfQ==