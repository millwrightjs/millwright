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
        } else if (['partial', 'lambda'].includes(file.role)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9zZXJ2ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJjaG9raWRhciIsImJzIiwiY3JlYXRlIiwiY29uZmlnIiwiY2FjaGUiLCJtYWtlIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VydmUiLCJwcm9jZXNzIiwiZW52IiwidGFzayIsInNyY0RpclJlc29sdmVkIiwicmVzb2x2ZSIsInNyY0RpciIsImFib3ZlU3JjUGF0aHMiLCJnZXQiLCJrZXlzIiwiY29uY2F0IiwibWFwIiwiZmlsdGVyIiwic3JjUmVzb2x2ZWQiLCJzdGFydHNXaXRoIiwidW5pcSIsInZhbHVlIiwid2F0Y2hPcHRzIiwiaWdub3JlSW5pdGlhbCIsIndhdGNoIiwib24iLCJldmVudCIsImNoYW5nZWRQYXRoIiwidGhlbiIsInJlbG9hZCIsImZpbGUiLCJjb25zdW1lcnMiLCJhc3NldHMiLCJyZWxvYWRUYXJnZXRzIiwic2hvdWxkTWFrZSIsInNob3VsZE1ha2VBbGwiLCJpbmNsdWRlcyIsInJvbGUiLCJkZXBzIiwiZGVwIiwiY29uc3VtZXIiLCJwdXNoIiwiYXNzZXRDb25zdW1lcnMiLCJkZXN0UmVzb2x2ZWQiLCJzdGF0aWMiLCJ0ZW1wbGF0ZXMiLCJmb3JFYWNoIiwib3B0cyIsInNob3VsZEdldFBhcnRpYWxzIiwic2hvdWxkR2V0TGFtYmRhcyIsInRlbXBsYXRlIiwidGFyZ2V0ZWQiLCJic09wdHMiLCJzZXJ2ZXIiLCJiYXNlRGlyIiwiZGVzdERpciIsInNlcnZlU3RhdGljT3B0aW9ucyIsImV4dGVuc2lvbnMiLCJzbmlwcGV0T3B0aW9ucyIsInJ1bGUiLCJtYXRjaCIsImZuIiwic25pcHBldCIsIm5vdGlmeSIsImdob3N0TW9kZSIsImluaXQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNQSxPQUFPQyxRQUFRLE1BQVIsQ0FBYjtBQUNBLElBQU1DLElBQUlELFFBQVEsUUFB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QUFPckQsU0FQTSxNQU9BO0FBQ0xaLDBCQUFnQixJQUFoQjtBQUNEOztBQUVELFlBQUlBLGFBQUosRUFBbUI7QUFDakJwQyxpQkFBTzZCLElBQVAsQ0FBWTtBQUFBLG1CQUFNakMsR0FBR2tDLE1BQUgsRUFBTjtBQUFBLFdBQVo7QUFDRCxTQUZELE1BRU8sSUFBSUssVUFBSixFQUFnQjtBQUNyQm5DLGVBQUssRUFBQ2lDLGNBQUQsRUFBU21CLFVBQVUsSUFBbkIsRUFBTCxFQUErQnZCLElBQS9CLENBQW9DO0FBQUEsbUJBQU1qQyxHQUFHa0MsTUFBSCxDQUFVSSxhQUFWLENBQU47QUFBQSxXQUFwQztBQUNELFNBRk0sTUFFQTtBQUNMdEMsYUFBR2tDLE1BQUg7QUFDRDtBQUNGLE9BM0REO0FBZmdDO0FBMkVqQzs7QUFFRCxNQUFNdUIsU0FBUztBQUNiQyxZQUFRO0FBQ05DLGVBQVN6RCxPQUFPMEQsT0FEVjtBQUVOQywwQkFBb0I7QUFDbEJDLG9CQUFZLENBQUMsTUFBRDtBQURNO0FBRmQsS0FESztBQU9iQyxvQkFBZ0I7QUFDZEMsWUFBTTtBQUNKQyxlQUFPLEdBREg7QUFFSkMsWUFBSSxZQUFVQyxPQUFWLEVBQW1CO0FBQ3JCLGlCQUFPQSxPQUFQO0FBQ0Q7QUFKRztBQURRLEtBUEg7QUFlYkMsWUFBUSxLQWZLO0FBZ0JiQyxlQUFXO0FBaEJFLEdBQWY7O0FBbUJBckUsS0FBR3NFLElBQUgsQ0FBUWIsTUFBUjtBQUNEIiwiZmlsZSI6InNlcnZlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGNob2tpZGFyID0gcmVxdWlyZSgnY2hva2lkYXInKTtcbmNvbnN0IGJzID0gcmVxdWlyZSgnYnJvd3Nlci1zeW5jJykuY3JlYXRlKCk7XG5jb25zdCBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcbmNvbnN0IGNhY2hlID0gcmVxdWlyZSAoJy4uL3V0aWxzL2NhY2hlJyk7XG5jb25zdCBtYWtlID0gcmVxdWlyZSgnLi9tYWtlJyk7XG5jb25zdCByZXF1aXJlRGlyID0gcmVxdWlyZSgncmVxdWlyZS1kaXInKTtcbmNvbnN0IHBsdWdpbnMgPSByZXF1aXJlRGlyKCcuLi9wbHVnaW5zJywge2NhbWVsY2FzZTogdHJ1ZX0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlcnZlO1xuXG5mdW5jdGlvbiBzZXJ2ZSgpIHtcbiAgaWYgKHByb2Nlc3MuZW52LnRhc2sgIT09ICdidWlsZCcpIHtcblxuICAgIGNvbnN0IHNyY0RpclJlc29sdmVkID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5zcmNEaXIpO1xuXG4gICAgY29uc3QgYWJvdmVTcmNQYXRocyA9IF8oY2FjaGUuZ2V0KCdmaWxlcycpKVxuICAgICAgLmtleXMoKVxuICAgICAgLmNvbmNhdChfLm1hcChjYWNoZS5nZXQoJ2RlcHMnKSwgJ3NyY1Jlc29sdmVkJykpXG4gICAgICAuZmlsdGVyKHNyY1Jlc29sdmVkID0+ICFzcmNSZXNvbHZlZC5zdGFydHNXaXRoKHNyY0RpclJlc29sdmVkKSlcbiAgICAgIC51bmlxKClcbiAgICAgIC52YWx1ZSgpO1xuXG4gICAgY29uc3Qgd2F0Y2hPcHRzID0ge1xuICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZVxuICAgIH07XG5cbiAgICBjaG9raWRhci53YXRjaChbc3JjRGlyUmVzb2x2ZWQsIC4uLmFib3ZlU3JjUGF0aHNdLCB3YXRjaE9wdHMpLm9uKCdhbGwnLCAoZXZlbnQsIGNoYW5nZWRQYXRoKSA9PiB7XG4gICAgICBpZiAoZXZlbnQgIT09ICdjaGFuZ2UnKSB7XG4gICAgICAgIHJldHVybiBtYWtlKCkudGhlbigoKSA9PiBicy5yZWxvYWQoKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGUgPSBjYWNoZS5nZXQoJ2ZpbGVzJywgY2hhbmdlZFBhdGgpO1xuICAgICAgY29uc3QgY29uc3VtZXJzID0gW107XG4gICAgICBjb25zdCBhc3NldHMgPSBbXTtcbiAgICAgIGNvbnN0IHJlbG9hZFRhcmdldHMgPSBbXTtcbiAgICAgIHZhciBzaG91bGRNYWtlID0gZmFsc2U7XG4gICAgICB2YXIgc2hvdWxkTWFrZUFsbCA9IGZhbHNlO1xuXG4gICAgICBpZiAoWydhc3NldCcsICdpbXBvcnQnLCAnd3JhcHBlciddLmluY2x1ZGVzKGZpbGUucm9sZSkpIHtcbiAgICAgICAgY29uc3QgZGVwcyA9IF8oY2FjaGUuZ2V0KCdkZXBzJykpXG4gICAgICAgICAgLmZpbHRlcih7c3JjUmVzb2x2ZWQ6IGNoYW5nZWRQYXRofSlcbiAgICAgICAgICAubWFwKGRlcCA9PiBjYWNoZS5nZXQoJ2ZpbGVzJywgZGVwLmNvbnN1bWVyKSlcbiAgICAgICAgICAudW5pcSgpXG4gICAgICAgICAgLnZhbHVlKCk7XG5cbiAgICAgICAgY29uc3VtZXJzLnB1c2goLi4uZGVwcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWxlLnJvbGUgPT09ICdhc3NldCcpIHtcbiAgICAgICAgYXNzZXRzLnB1c2goZmlsZSk7XG4gICAgICAgIGNvbnN0IGFzc2V0Q29uc3VtZXJzID0gXy5maWx0ZXIoY29uc3VtZXJzLCB7cm9sZTogJ2Fzc2V0J30pO1xuICAgICAgICBhc3NldHMucHVzaCguLi5hc3NldENvbnN1bWVycyk7XG4gICAgICAgIHJlbG9hZFRhcmdldHMucHVzaChmaWxlLmRlc3RSZXNvbHZlZCk7XG4gICAgICAgIHJlbG9hZFRhcmdldHMucHVzaCguLi5fLm1hcChhc3NldENvbnN1bWVycywgJ2Rlc3RSZXNvbHZlZCcpKTtcbiAgICAgICAgc2hvdWxkTWFrZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ2ltcG9ydCcpIHtcbiAgICAgICAgY29uc3QgYXNzZXRDb25zdW1lcnMgPSBfLmZpbHRlcihjb25zdW1lcnMsIHtyb2xlOiAnYXNzZXQnfSk7XG4gICAgICAgIGFzc2V0cy5wdXNoKC4uLmFzc2V0Q29uc3VtZXJzKTtcbiAgICAgICAgcmVsb2FkVGFyZ2V0cy5wdXNoKC4uLl8ubWFwKGFzc2V0Q29uc3VtZXJzLCAnZGVzdFJlc29sdmVkJykpO1xuICAgICAgICBzaG91bGRNYWtlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnZGF0YScpIHtcbiAgICAgICAgc2hvdWxkTWFrZUFsbCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ3RlbXBsYXRlJykge1xuICAgICAgICBwbHVnaW5zLnN0YXRpYyhmaWxlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZS5yb2xlID09PSAnd3JhcHBlcicpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVzID0gXy5maWx0ZXIoY29uc3VtZXJzLCB7cm9sZTogJ3RlbXBsYXRlJ30pO1xuICAgICAgICB0ZW1wbGF0ZXMuZm9yRWFjaChwbHVnaW5zLnN0YXRpYyk7XG4gICAgICB9IGVsc2UgaWYgKFsncGFydGlhbCcsICdsYW1iZGEnXS5pbmNsdWRlcyhmaWxlLnJvbGUpKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgICAgc2hvdWxkR2V0UGFydGlhbHM6IGZpbGUucm9sZSA9PT0gJ3BhcnRpYWwnLFxuICAgICAgICAgIHNob3VsZEdldExhbWJkYXM6IGZpbGUucm9sZSA9PT0gJ2xhbWJkYSdcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVzID0gXy5maWx0ZXIoY2FjaGUuZ2V0KCdmaWxlcycpLCB7cm9sZTogJ3RlbXBsYXRlJ30pO1xuICAgICAgICB0ZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiBwbHVnaW5zLnN0YXRpYyh0ZW1wbGF0ZSwgb3B0cykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hvdWxkTWFrZUFsbCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRNYWtlQWxsKSB7XG4gICAgICAgIG1ha2UoKS50aGVuKCgpID0+IGJzLnJlbG9hZCgpKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkTWFrZSkge1xuICAgICAgICBtYWtlKHthc3NldHMsIHRhcmdldGVkOiB0cnVlfSkudGhlbigoKSA9PiBicy5yZWxvYWQocmVsb2FkVGFyZ2V0cykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnMucmVsb2FkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBic09wdHMgPSB7XG4gICAgc2VydmVyOiB7XG4gICAgICBiYXNlRGlyOiBjb25maWcuZGVzdERpcixcbiAgICAgIHNlcnZlU3RhdGljT3B0aW9uczoge1xuICAgICAgICBleHRlbnNpb25zOiBbJ2h0bWwnXVxuICAgICAgfVxuICAgIH0sXG4gICAgc25pcHBldE9wdGlvbnM6IHtcbiAgICAgIHJ1bGU6IHtcbiAgICAgICAgbWF0Y2g6IC8kLyxcbiAgICAgICAgZm46IGZ1bmN0aW9uIChzbmlwcGV0KSB7XG4gICAgICAgICAgcmV0dXJuIHNuaXBwZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG5vdGlmeTogZmFsc2UsXG4gICAgZ2hvc3RNb2RlOiBmYWxzZVxuICB9O1xuXG4gIGJzLmluaXQoYnNPcHRzKTtcbn1cbiJdfQ==