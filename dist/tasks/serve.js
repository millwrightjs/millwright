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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9zZXJ2ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJjaG9raWRhciIsImJzIiwiY3JlYXRlIiwiY29uZmlnIiwiY2FjaGUiLCJtYWtlIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VydmUiLCJwcm9jZXNzIiwiZW52IiwidGFzayIsInNyY0RpclJlc29sdmVkIiwicmVzb2x2ZSIsInNyY0RpciIsImFib3ZlU3JjUGF0aHMiLCJnZXQiLCJrZXlzIiwiY29uY2F0IiwibWFwIiwiZmlsdGVyIiwic3JjUmVzb2x2ZWQiLCJzdGFydHNXaXRoIiwidW5pcSIsInZhbHVlIiwid2F0Y2hPcHRzIiwiaWdub3JlSW5pdGlhbCIsIndhdGNoIiwib24iLCJldmVudCIsImNoYW5nZWRQYXRoIiwidGhlbiIsInJlbG9hZCIsImZpbGUiLCJjb25zdW1lcnMiLCJhc3NldHMiLCJyZWxvYWRUYXJnZXRzIiwic2hvdWxkTWFrZSIsInNob3VsZE1ha2VBbGwiLCJpbmNsdWRlcyIsInJvbGUiLCJkZXBzIiwiZGVwIiwiY29uc3VtZXIiLCJwdXNoIiwiYXNzZXRDb25zdW1lcnMiLCJkZXN0UmVzb2x2ZWQiLCJzdGF0aWMiLCJ0ZW1wbGF0ZXMiLCJmb3JFYWNoIiwib3B0cyIsInNob3VsZEdldFBhcnRpYWxzIiwic2hvdWxkR2V0TGFtYmRhcyIsInRlbXBsYXRlIiwidGFyZ2V0ZWQiLCJic09wdHMiLCJzZXJ2ZXIiLCJiYXNlRGlyIiwiZGVzdERpciIsInNlcnZlU3RhdGljT3B0aW9ucyIsImV4dGVuc2lvbnMiLCJzbmlwcGV0T3B0aW9ucyIsInJ1bGUiLCJtYXRjaCIsImZuIiwic25pcHBldCIsIm5vdGlmeSIsImdob3N0TW9kZSIsImluaXQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNQSxPQUFPQyxRQUFRLE1BQVIsQ0FBYjtBQUNBLElBQU1DLElBQUlELFFBQVEsUUFB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Q0FBWjtBQUFBLGFBQWxCO0FBTnVEO0FBT3hELFNBUE0sTUFPQTtBQUNMWiwwQkFBZ0IsSUFBaEI7QUFDRDs7QUFFRCxZQUFJQSxhQUFKLEVBQW1CO0FBQ2pCcEMsaUJBQU82QixJQUFQLENBQVk7QUFBQSxtQkFBTWpDLEdBQUdrQyxNQUFILEVBQU47QUFBQSxXQUFaO0FBQ0QsU0FGRCxNQUVPLElBQUlLLFVBQUosRUFBZ0I7QUFDckJuQyxlQUFLLEVBQUNpQyxjQUFELEVBQVNtQixVQUFVLElBQW5CLEVBQUwsRUFBK0J2QixJQUEvQixDQUFvQztBQUFBLG1CQUFNakMsR0FBR2tDLE1BQUgsQ0FBVUksYUFBVixDQUFOO0FBQUEsV0FBcEM7QUFDRCxTQUZNLE1BRUE7QUFDTHRDLGFBQUdrQyxNQUFIO0FBQ0Q7QUFDRixPQTNERDtBQWZnQztBQTJFakM7O0FBRUQsTUFBTXVCLFNBQVM7QUFDYkMsWUFBUTtBQUNOQyxlQUFTekQsT0FBTzBELE9BRFY7QUFFTkMsMEJBQW9CO0FBQ2xCQyxvQkFBWSxDQUFDLE1BQUQ7QUFETTtBQUZkLEtBREs7QUFPYkMsb0JBQWdCO0FBQ2RDLFlBQU07QUFDSkMsZUFBTyxHQURIO0FBRUpDLFlBQUksWUFBVUMsT0FBVixFQUFtQjtBQUNyQixpQkFBT0EsT0FBUDtBQUNEO0FBSkc7QUFEUSxLQVBIO0FBZWJDLFlBQVEsS0FmSztBQWdCYkMsZUFBVztBQWhCRSxHQUFmOztBQW1CQXJFLEtBQUdzRSxJQUFILENBQVFiLE1BQVI7QUFDRCIsImZpbGUiOiJzZXJ2ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjaG9raWRhciA9IHJlcXVpcmUoJ2Nob2tpZGFyJyk7XG5jb25zdCBicyA9IHJlcXVpcmUoJ2Jyb3dzZXItc3luYycpLmNyZWF0ZSgpO1xuY29uc3QgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5jb25zdCBjYWNoZSA9IHJlcXVpcmUgKCcuLi91dGlscy9jYWNoZScpO1xuY29uc3QgbWFrZSA9IHJlcXVpcmUoJy4vbWFrZScpO1xuY29uc3QgcmVxdWlyZURpciA9IHJlcXVpcmUoJ3JlcXVpcmUtZGlyJyk7XG5jb25zdCBwbHVnaW5zID0gcmVxdWlyZURpcignLi4vcGx1Z2lucycsIHtjYW1lbGNhc2U6IHRydWV9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXJ2ZTtcblxuZnVuY3Rpb24gc2VydmUoKSB7XG4gIGlmIChwcm9jZXNzLmVudi50YXNrICE9PSAnYnVpbGQnKSB7XG5cbiAgICBjb25zdCBzcmNEaXJSZXNvbHZlZCA9IHBhdGgucmVzb2x2ZShjb25maWcuc3JjRGlyKTtcblxuICAgIGNvbnN0IGFib3ZlU3JjUGF0aHMgPSBfKGNhY2hlLmdldCgnZmlsZXMnKSlcbiAgICAgIC5rZXlzKClcbiAgICAgIC5jb25jYXQoXy5tYXAoY2FjaGUuZ2V0KCdkZXBzJyksICdzcmNSZXNvbHZlZCcpKVxuICAgICAgLmZpbHRlcihzcmNSZXNvbHZlZCA9PiAhc3JjUmVzb2x2ZWQuc3RhcnRzV2l0aChzcmNEaXJSZXNvbHZlZCkpXG4gICAgICAudW5pcSgpXG4gICAgICAudmFsdWUoKTtcblxuICAgIGNvbnN0IHdhdGNoT3B0cyA9IHtcbiAgICAgIGlnbm9yZUluaXRpYWw6IHRydWVcbiAgICB9O1xuXG4gICAgY2hva2lkYXIud2F0Y2goW3NyY0RpclJlc29sdmVkLCAuLi5hYm92ZVNyY1BhdGhzXSwgd2F0Y2hPcHRzKS5vbignYWxsJywgKGV2ZW50LCBjaGFuZ2VkUGF0aCkgPT4ge1xuICAgICAgaWYgKGV2ZW50ICE9PSAnY2hhbmdlJykge1xuICAgICAgICByZXR1cm4gbWFrZSgpLnRoZW4oKCkgPT4gYnMucmVsb2FkKCkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlID0gY2FjaGUuZ2V0KCdmaWxlcycsIGNoYW5nZWRQYXRoKTtcbiAgICAgIGNvbnN0IGNvbnN1bWVycyA9IFtdO1xuICAgICAgY29uc3QgYXNzZXRzID0gW107XG4gICAgICBjb25zdCByZWxvYWRUYXJnZXRzID0gW107XG4gICAgICB2YXIgc2hvdWxkTWFrZSA9IGZhbHNlO1xuICAgICAgdmFyIHNob3VsZE1ha2VBbGwgPSBmYWxzZTtcblxuICAgICAgaWYgKF8uaW5jbHVkZXMoWydhc3NldCcsICdpbXBvcnQnLCAnd3JhcHBlciddLCBmaWxlLnJvbGUpKSB7XG4gICAgICAgIGNvbnN0IGRlcHMgPSBfKGNhY2hlLmdldCgnZGVwcycpKVxuICAgICAgICAgIC5maWx0ZXIoe3NyY1Jlc29sdmVkOiBjaGFuZ2VkUGF0aH0pXG4gICAgICAgICAgLm1hcChkZXAgPT4gY2FjaGUuZ2V0KCdmaWxlcycsIGRlcC5jb25zdW1lcikpXG4gICAgICAgICAgLnVuaXEoKVxuICAgICAgICAgIC52YWx1ZSgpO1xuXG4gICAgICAgIGNvbnN1bWVycy5wdXNoKC4uLmRlcHMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlsZS5yb2xlID09PSAnYXNzZXQnKSB7XG4gICAgICAgIGFzc2V0cy5wdXNoKGZpbGUpO1xuICAgICAgICBjb25zdCBhc3NldENvbnN1bWVycyA9IF8uZmlsdGVyKGNvbnN1bWVycywge3JvbGU6ICdhc3NldCd9KTtcbiAgICAgICAgYXNzZXRzLnB1c2goLi4uYXNzZXRDb25zdW1lcnMpO1xuICAgICAgICByZWxvYWRUYXJnZXRzLnB1c2goZmlsZS5kZXN0UmVzb2x2ZWQpO1xuICAgICAgICByZWxvYWRUYXJnZXRzLnB1c2goLi4uXy5tYXAoYXNzZXRDb25zdW1lcnMsICdkZXN0UmVzb2x2ZWQnKSk7XG4gICAgICAgIHNob3VsZE1ha2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICdpbXBvcnQnKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0Q29uc3VtZXJzID0gXy5maWx0ZXIoY29uc3VtZXJzLCB7cm9sZTogJ2Fzc2V0J30pO1xuICAgICAgICBhc3NldHMucHVzaCguLi5hc3NldENvbnN1bWVycyk7XG4gICAgICAgIHJlbG9hZFRhcmdldHMucHVzaCguLi5fLm1hcChhc3NldENvbnN1bWVycywgJ2Rlc3RSZXNvbHZlZCcpKTtcbiAgICAgICAgc2hvdWxkTWFrZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ2RhdGEnKSB7XG4gICAgICAgIHNob3VsZE1ha2VBbGwgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChmaWxlLnJvbGUgPT09ICd0ZW1wbGF0ZScpIHtcbiAgICAgICAgcGx1Z2lucy5zdGF0aWMoZmlsZSk7XG4gICAgICB9IGVsc2UgaWYgKGZpbGUucm9sZSA9PT0gJ3dyYXBwZXInKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlcyA9IF8uZmlsdGVyKGNvbnN1bWVycywge3JvbGU6ICd0ZW1wbGF0ZSd9KTtcbiAgICAgICAgdGVtcGxhdGVzLmZvckVhY2gocGx1Z2lucy5zdGF0aWMpO1xuICAgICAgfSBlbHNlIGlmIChfLmluY2x1ZGVzKFsncGFydGlhbCcsICdsYW1iZGEnXSwgZmlsZS5yb2xlKSkge1xuICAgICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAgIHNob3VsZEdldFBhcnRpYWxzOiBmaWxlLnJvbGUgPT09ICdwYXJ0aWFsJyxcbiAgICAgICAgICBzaG91bGRHZXRMYW1iZGFzOiBmaWxlLnJvbGUgPT09ICdsYW1iZGEnXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlcyA9IF8uZmlsdGVyKGNhY2hlLmdldCgnZmlsZXMnKSwge3JvbGU6ICd0ZW1wbGF0ZSd9KTtcbiAgICAgICAgdGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4gcGx1Z2lucy5zdGF0aWModGVtcGxhdGUsIG9wdHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNob3VsZE1ha2VBbGwgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2hvdWxkTWFrZUFsbCkge1xuICAgICAgICBtYWtlKCkudGhlbigoKSA9PiBicy5yZWxvYWQoKSk7XG4gICAgICB9IGVsc2UgaWYgKHNob3VsZE1ha2UpIHtcbiAgICAgICAgbWFrZSh7YXNzZXRzLCB0YXJnZXRlZDogdHJ1ZX0pLnRoZW4oKCkgPT4gYnMucmVsb2FkKHJlbG9hZFRhcmdldHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJzLnJlbG9hZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgYnNPcHRzID0ge1xuICAgIHNlcnZlcjoge1xuICAgICAgYmFzZURpcjogY29uZmlnLmRlc3REaXIsXG4gICAgICBzZXJ2ZVN0YXRpY09wdGlvbnM6IHtcbiAgICAgICAgZXh0ZW5zaW9uczogWydodG1sJ11cbiAgICAgIH1cbiAgICB9LFxuICAgIHNuaXBwZXRPcHRpb25zOiB7XG4gICAgICBydWxlOiB7XG4gICAgICAgIG1hdGNoOiAvJC8sXG4gICAgICAgIGZuOiBmdW5jdGlvbiAoc25pcHBldCkge1xuICAgICAgICAgIHJldHVybiBzbmlwcGV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBub3RpZnk6IGZhbHNlLFxuICAgIGdob3N0TW9kZTogZmFsc2VcbiAgfTtcblxuICBicy5pbml0KGJzT3B0cyk7XG59XG4iXX0=