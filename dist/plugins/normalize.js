'use strict';

var path = require('path');
var _ = require('lodash');
var fs = require('fs-extra');
var pathExists = require('path-exists').sync;
var config = require('../config');
var requireDir = require('require-dir');
var plugins = requireDir('../plugins', { camelcase: true });
var cache = require('../utils/cache');

var _require = require('../utils/util'),
    getType = _require.getType,
    stripIgnoredBasePath = _require.stripIgnoredBasePath,
    changeExt = _require.changeExt,
    getCompiledType = _require.getCompiledType;

module.exports = normalize;

function normalizeBase(src) {
  var normalized = path.parse(src);
  normalized.src = src;
  normalized.srcResolved = path.resolve(src);
  normalized.dirResolved = path.dirname(normalized.srcResolved);
  normalized.srcStripped = stripIgnoredBasePath(src, config.assetIgnoredBasePaths);

  return normalized;
}

function normalize(paths) {
  var task = process.env.task || 'make';
  var srcDirResolved = path.resolve(config.srcDir);

  return _(paths).map(function (src) {
    var normalized = normalizeBase(src);
    var type = _.trimStart(normalized.ext, '.');
    var parentDir = normalized.dir.slice(normalized.dir.lastIndexOf(path.sep) + path.sep.length);

    if (type === 'mustache') {
      if (parentDir === 'partials') {
        normalized.role = 'partial';
      } else if (normalized.name === 'wrapper') {
        normalized.role = 'wrapper';
      } else {
        normalized.role = 'template';
        normalized.dest = path.join(config.destDir, changeExt(normalized.srcStripped, '.html'));
        normalized.destResolved = path.resolve(normalized.dest);
      }
    } else if (type === 'js' && parentDir === 'lambdas') {
      normalized.role = 'lambda';
    }

    return normalized;
  }).map(function (file, index, files) {
    if (file.role === 'wrapper') {
      var data = _.find(files, { srcResolved: changeExt(file.srcResolved, '.json') });
      if (data) {
        data.role = 'data';
        file.data = data.srcResolved;
      }
    }

    return file;
  }).map(function (file, index, files) {
    if (file.role === 'template') {
      var wrapper = getWrapper(file.srcResolved, files, srcDirResolved);
      if (wrapper) {
        file.wrapper = wrapper.srcResolved;
        file.wrapperData = wrapper.data;
      }
      var data = _.find(files, { src: changeExt(file.src, '.json') });
      if (data) {
        data.role = 'data';
        file.data = data.srcResolved;
      }
    }

    return file;
  }).map(function (file) {
    if (file.role === 'data') {
      file.content = fs.readJsonSync(file.src);
    }
    return file;
  }).map(function (file) {
    if (file.role === 'data' && file.content.assets) {
      file.content.assets = _.mapValues(file.content.assets, function (group, key) {
        return _(group).map(function (dep) {
          var activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
          var depIsUrl = ['http://', 'https://', '//'].find(function (str) {
            return dep.startsWith(str);
          });

          if (depIsUrl) {
            return dep;
          }

          var src = path.join(file.dir, dep);

          // Cache non-assets as files without roles - this allows copying of arbitrary files from
          // above the src directory, eg. font files from the font-awesome npm package
          var type = path.extname(dep).slice(1);
          if (!activeAssetTypes.includes(type)) {
            var normalized = normalizeBase(src);
            cache.set('files', 'srcResolved', normalized);
            return path.join(config.destDir, normalized.srcStripped);
          }

          var ref = path.parse(src);

          // Swap in minified src when appropriate (and if exists)
          var compiledType = getCompiledType(getType(ref.ext));
          if (!ref.name.endsWith('.min') && !compiledType) {
            var srcMinSuffix = ['.min', '-min'].find(function (suffix) {
              return pathExists(path.join(ref.dir, ref.name + suffix + ref.ext));
            });
            if (srcMinSuffix) {
              ref.isMinified = true;
            }
            if (srcMinSuffix && process.env.task === 'build') {
              src = path.join(ref.dir, ref.name + srcMinSuffix + ref.ext);
              ref = path.parse(src);
              ref.isMinified = true;
            }
          }

          ref.src = src;
          ref.srcResolved = path.resolve(src);
          ref.consumer = file.srcResolved;
          ref.groupKey = key;
          ref.role = 'asset';
          cache.push('deps', ref);
          return plugins.getWebPath(src, file, key);
        }).uniq().value();
      });
    }
    return file;
  }).value();
}

function getWrapper(ref, files, srcRoot) {
  var dir = path.dirname(ref);
  return dir.length >= srcRoot.length && (files.find(function (f) {
    return _.isMatch(f, { role: 'wrapper', dirResolved: dir });
  }) || getWrapper(dir, files, srcRoot));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL25vcm1hbGl6ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJmcyIsInBhdGhFeGlzdHMiLCJzeW5jIiwiY29uZmlnIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJjYWNoZSIsImdldFR5cGUiLCJzdHJpcElnbm9yZWRCYXNlUGF0aCIsImNoYW5nZUV4dCIsImdldENvbXBpbGVkVHlwZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJub3JtYWxpemUiLCJub3JtYWxpemVCYXNlIiwic3JjIiwibm9ybWFsaXplZCIsInBhcnNlIiwic3JjUmVzb2x2ZWQiLCJyZXNvbHZlIiwiZGlyUmVzb2x2ZWQiLCJkaXJuYW1lIiwic3JjU3RyaXBwZWQiLCJhc3NldElnbm9yZWRCYXNlUGF0aHMiLCJwYXRocyIsInRhc2siLCJwcm9jZXNzIiwiZW52Iiwic3JjRGlyUmVzb2x2ZWQiLCJzcmNEaXIiLCJtYXAiLCJ0eXBlIiwidHJpbVN0YXJ0IiwiZXh0IiwicGFyZW50RGlyIiwiZGlyIiwic2xpY2UiLCJsYXN0SW5kZXhPZiIsInNlcCIsImxlbmd0aCIsInJvbGUiLCJuYW1lIiwiZGVzdCIsImpvaW4iLCJkZXN0RGlyIiwiZGVzdFJlc29sdmVkIiwiZmlsZSIsImluZGV4IiwiZmlsZXMiLCJkYXRhIiwiZmluZCIsIndyYXBwZXIiLCJnZXRXcmFwcGVyIiwid3JhcHBlckRhdGEiLCJjb250ZW50IiwicmVhZEpzb25TeW5jIiwiYXNzZXRzIiwibWFwVmFsdWVzIiwiZ3JvdXAiLCJrZXkiLCJhY3RpdmVBc3NldFR5cGVzIiwiZGVwSXNVcmwiLCJkZXAiLCJzdGFydHNXaXRoIiwic3RyIiwiZXh0bmFtZSIsImluY2x1ZGVzIiwic2V0IiwicmVmIiwiY29tcGlsZWRUeXBlIiwiZW5kc1dpdGgiLCJzcmNNaW5TdWZmaXgiLCJzdWZmaXgiLCJpc01pbmlmaWVkIiwiY29uc3VtZXIiLCJncm91cEtleSIsInB1c2giLCJn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LEdBQVcsT0FBWDtBQUNBbEMsZ0JBQU1zRSxJQUFOLENBQVcsTUFBWCxFQUFtQlIsR0FBbkI7QUFDQSxpQkFBT2hFLFFBQVF5RSxVQUFSLENBQW1COUQsR0FBbkIsRUFBd0IrQixJQUF4QixFQUE4QmEsR0FBOUIsQ0FBUDtBQUNELFNBNUNNLEVBNENKbUIsSUE1Q0ksR0E0Q0dDLEtBNUNILEVBQVA7QUE2Q0QsT0E5Q3FCLENBQXRCO0FBK0NEO0FBQ0QsV0FBT2pDLElBQVA7QUFDRCxHQTFHSSxFQTJHSmlDLEtBM0dJLEVBQVA7QUE0R0Q7O0FBR0QsU0FBUzNCLFVBQVQsQ0FBb0JnQixHQUFwQixFQUF5QnBCLEtBQXpCLEVBQWdDZ0MsT0FBaEMsRUFBeUM7QUFDdkMsTUFBTTdDLE1BQU12QyxLQUFLeUIsT0FBTCxDQUFhK0MsR0FBYixDQUFaO0FBQ0EsU0FBT2pDLElBQUlJLE1BQUosSUFBY3lDLFFBQVF6QyxNQUF0QixLQUFpQ1MsTUFBTUUsSUFBTixDQUFXLGFBQUs7QUFDdEQsV0FBT3BELEVBQUVtRixPQUFGLENBQVVDLENBQVYsRUFBYSxFQUFDMUMsTUFBTSxTQUFQLEVBQWtCcEIsYUFBYWUsR0FBL0IsRUFBYixDQUFQO0FBQ0QsR0FGdUMsS0FFbENpQixXQUFXakIsR0FBWCxFQUFnQmEsS0FBaEIsRUFBdUJnQyxPQUF2QixDQUZDLENBQVA7QUFHRCIsImZpbGUiOiJub3JtYWxpemUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuY29uc3QgcGF0aEV4aXN0cyA9IHJlcXVpcmUoJ3BhdGgtZXhpc3RzJykuc3luYztcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuY29uc3QgcmVxdWlyZURpciA9IHJlcXVpcmUoJ3JlcXVpcmUtZGlyJyk7XG5jb25zdCBwbHVnaW5zID0gcmVxdWlyZURpcignLi4vcGx1Z2lucycsIHtjYW1lbGNhc2U6IHRydWV9KTtcbmNvbnN0IGNhY2hlID0gcmVxdWlyZSgnLi4vdXRpbHMvY2FjaGUnKTtcbmNvbnN0IHtnZXRUeXBlLCBzdHJpcElnbm9yZWRCYXNlUGF0aCwgY2hhbmdlRXh0LCBnZXRDb21waWxlZFR5cGV9ID0gcmVxdWlyZSgnLi4vdXRpbHMvdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vcm1hbGl6ZTtcblxuZnVuY3Rpb24gbm9ybWFsaXplQmFzZShzcmMpIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHBhdGgucGFyc2Uoc3JjKTtcbiAgbm9ybWFsaXplZC5zcmMgPSBzcmM7XG4gIG5vcm1hbGl6ZWQuc3JjUmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoc3JjKTtcbiAgbm9ybWFsaXplZC5kaXJSZXNvbHZlZCA9IHBhdGguZGlybmFtZShub3JtYWxpemVkLnNyY1Jlc29sdmVkKTtcbiAgbm9ybWFsaXplZC5zcmNTdHJpcHBlZCA9IHN0cmlwSWdub3JlZEJhc2VQYXRoKHNyYywgY29uZmlnLmFzc2V0SWdub3JlZEJhc2VQYXRocyk7XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRocykge1xuICBjb25zdCB0YXNrID0gcHJvY2Vzcy5lbnYudGFzayB8fCAnbWFrZSc7XG4gIGNvbnN0IHNyY0RpclJlc29sdmVkID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5zcmNEaXIpO1xuXG4gIHJldHVybiBfKHBhdGhzKVxuICAgIC5tYXAoc3JjID0+IHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCYXNlKHNyYyk7XG4gICAgICBjb25zdCB0eXBlID0gXy50cmltU3RhcnQobm9ybWFsaXplZC5leHQsICcuJyk7XG4gICAgICBjb25zdCBwYXJlbnREaXIgPSBub3JtYWxpemVkLmRpci5zbGljZShub3JtYWxpemVkLmRpci5sYXN0SW5kZXhPZihwYXRoLnNlcCkgKyBwYXRoLnNlcC5sZW5ndGgpO1xuXG4gICAgICBpZiAodHlwZSA9PT0gJ211c3RhY2hlJykge1xuICAgICAgICBpZiAocGFyZW50RGlyID09PSAncGFydGlhbHMnKSB7XG4gICAgICAgICAgbm9ybWFsaXplZC5yb2xlID0gJ3BhcnRpYWwnO1xuICAgICAgICB9IGVsc2UgaWYgKG5vcm1hbGl6ZWQubmFtZSA9PT0gJ3dyYXBwZXInKSB7XG4gICAgICAgICAgbm9ybWFsaXplZC5yb2xlID0gJ3dyYXBwZXInO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5vcm1hbGl6ZWQucm9sZSA9ICd0ZW1wbGF0ZSc7XG4gICAgICAgICAgbm9ybWFsaXplZC5kZXN0ID0gcGF0aC5qb2luKGNvbmZpZy5kZXN0RGlyLCBjaGFuZ2VFeHQobm9ybWFsaXplZC5zcmNTdHJpcHBlZCwgJy5odG1sJykpO1xuICAgICAgICAgIG5vcm1hbGl6ZWQuZGVzdFJlc29sdmVkID0gcGF0aC5yZXNvbHZlKG5vcm1hbGl6ZWQuZGVzdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2pzJyAmJiBwYXJlbnREaXIgPT09ICdsYW1iZGFzJykge1xuICAgICAgICBub3JtYWxpemVkLnJvbGUgPSAnbGFtYmRhJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfSlcbiAgICAubWFwKChmaWxlLCBpbmRleCwgZmlsZXMpID0+IHtcbiAgICAgIGlmIChmaWxlLnJvbGUgPT09ICd3cmFwcGVyJykge1xuICAgICAgICBjb25zdCBkYXRhID0gXy5maW5kKGZpbGVzLCB7c3JjUmVzb2x2ZWQ6IGNoYW5nZUV4dChmaWxlLnNyY1Jlc29sdmVkLCAnLmpzb24nKX0pO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgIGRhdGEucm9sZSA9ICdkYXRhJztcbiAgICAgICAgICBmaWxlLmRhdGEgPSBkYXRhLnNyY1Jlc29sdmVkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmaWxlO1xuICAgIH0pXG4gICAgLm1hcCgoZmlsZSwgaW5kZXgsIGZpbGVzKSA9PiB7XG4gICAgICBpZiAoZmlsZS5yb2xlID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgIGNvbnN0IHdyYXBwZXIgPSBnZXRXcmFwcGVyKGZpbGUuc3JjUmVzb2x2ZWQsIGZpbGVzLCBzcmNEaXJSZXNvbHZlZCk7XG4gICAgICAgIGlmICh3cmFwcGVyKSB7XG4gICAgICAgICAgZmlsZS53cmFwcGVyID0gd3JhcHBlci5zcmNSZXNvbHZlZDtcbiAgICAgICAgICBmaWxlLndyYXBwZXJEYXRhID0gd3JhcHBlci5kYXRhO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBfLmZpbmQoZmlsZXMsIHtzcmM6IGNoYW5nZUV4dChmaWxlLnNyYywgJy5qc29uJyl9KTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICBkYXRhLnJvbGUgPSAnZGF0YSc7XG4gICAgICAgICAgZmlsZS5kYXRhID0gZGF0YS5zcmNSZXNvbHZlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmlsZTtcbiAgICB9KVxuICAgIC5tYXAoZmlsZSA9PiB7XG4gICAgICBpZiAoZmlsZS5yb2xlID09PSAnZGF0YScpIHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gZnMucmVhZEpzb25TeW5jKGZpbGUuc3JjKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWxlO1xuICAgIH0pXG4gICAgLm1hcChmaWxlID0+IHtcbiAgICAgIGlmIChmaWxlLnJvbGUgPT09ICdkYXRhJyAmJiBmaWxlLmNvbnRlbnQuYXNzZXRzKSB7XG4gICAgICAgIGZpbGUuY29udGVudC5hc3NldHMgPSBfLm1hcFZhbHVlcyhmaWxlLmNvbnRlbnQuYXNzZXRzLCAoZ3JvdXAsIGtleSkgPT4ge1xuICAgICAgICAgIHJldHVybiBfKGdyb3VwKS5tYXAoZGVwID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUFzc2V0VHlwZXMgPSBbJ2NzcycsICdqcycsICdjb2ZmZWUnLCAnbGVzcycsICdzdHlsJywgJ3Nhc3MnLCAnc2NzcyddO1xuICAgICAgICAgICAgY29uc3QgZGVwSXNVcmwgPSBbJ2h0dHA6Ly8nLCAnaHR0cHM6Ly8nLCAnLy8nXS5maW5kKHN0ciA9PiBkZXAuc3RhcnRzV2l0aChzdHIpKTtcblxuICAgICAgICAgICAgaWYgKGRlcElzVXJsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmMgPSBwYXRoLmpvaW4oZmlsZS5kaXIsIGRlcCk7XG5cbiAgICAgICAgICAgIC8vIENhY2hlIG5vbi1hc3NldHMgYXMgZmlsZXMgd2l0aG91dCByb2xlcyAtIHRoaXMgYWxsb3dzIGNvcHlpbmcgb2YgYXJiaXRyYXJ5IGZpbGVzIGZyb21cbiAgICAgICAgICAgIC8vIGFib3ZlIHRoZSBzcmMgZGlyZWN0b3J5LCBlZy4gZm9udCBmaWxlcyBmcm9tIHRoZSBmb250LWF3ZXNvbWUgbnBtIHBhY2thZ2VcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBwYXRoLmV4dG5hbWUoZGVwKS5zbGljZSgxKTtcbiAgICAgICAgICAgIGlmICghYWN0aXZlQXNzZXRUeXBlcy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQmFzZShzcmMpO1xuICAgICAgICAgICAgICBjYWNoZS5zZXQoJ2ZpbGVzJywgJ3NyY1Jlc29sdmVkJywgbm9ybWFsaXplZCk7XG4gICAgICAgICAgICAgIHJldHVybiBwYXRoLmpvaW4oY29uZmlnLmRlc3REaXIsIG5vcm1hbGl6ZWQuc3JjU3RyaXBwZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcmVmID0gcGF0aC5wYXJzZShzcmMpO1xuXG4gICAgICAgICAgICAvLyBTd2FwIGluIG1pbmlmaWVkIHNyYyB3aGVuIGFwcHJvcHJpYXRlIChhbmQgaWYgZXhpc3RzKVxuICAgICAgICAgICAgY29uc3QgY29tcGlsZWRUeXBlID0gZ2V0Q29tcGlsZWRUeXBlKGdldFR5cGUocmVmLmV4dCkpO1xuICAgICAgICAgICAgaWYgKCFyZWYubmFtZS5lbmRzV2l0aCgnLm1pbicpICYmICFjb21waWxlZFR5cGUpIHtcbiAgICAgICAgICAgICAgY29uc3Qgc3JjTWluU3VmZml4ID0gWycubWluJywgJy1taW4nXS5maW5kKHN1ZmZpeCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhFeGlzdHMocGF0aC5qb2luKHJlZi5kaXIsIHJlZi5uYW1lICsgc3VmZml4ICsgcmVmLmV4dCkpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKHNyY01pblN1ZmZpeCkge1xuICAgICAgICAgICAgICAgIHJlZi5pc01pbmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoc3JjTWluU3VmZml4ICYmIHByb2Nlc3MuZW52LnRhc2sgPT09ICdidWlsZCcpIHtcbiAgICAgICAgICAgICAgICBzcmMgPSBwYXRoLmpvaW4ocmVmLmRpciwgcmVmLm5hbWUgKyBzcmNNaW5TdWZmaXggKyByZWYuZXh0KTtcbiAgICAgICAgICAgICAgICByZWYgPSBwYXRoLnBhcnNlKHNyYyk7XG4gICAgICAgICAgICAgICAgcmVmLmlzTWluaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlZi5zcmMgPSBzcmM7XG4gICAgICAgICAgICByZWYuc3JjUmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoc3JjKTtcbiAgICAgICAgICAgIHJlZi5jb25zdW1lciA9IGZpbGUuc3JjUmVzb2x2ZWQ7XG4gICAgICAgICAgICByZWYuZ3JvdXBLZXkgPSBrZXk7XG4gICAgICAgICAgICByZWYucm9sZSA9ICdhc3NldCc7XG4gICAgICAgICAgICBjYWNoZS5wdXNoKCdkZXBzJywgcmVmKTtcbiAgICAgICAgICAgIHJldHVybiBwbHVnaW5zLmdldFdlYlBhdGgoc3JjLCBmaWxlLCBrZXkpO1xuICAgICAgICAgIH0pLnVuaXEoKS52YWx1ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWxlO1xuICAgIH0pXG4gICAgLnZhbHVlKCk7XG59XG5cblxuZnVuY3Rpb24gZ2V0V3JhcHBlcihyZWYsIGZpbGVzLCBzcmNSb290KSB7XG4gIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShyZWYpO1xuICByZXR1cm4gZGlyLmxlbmd0aCA+PSBzcmNSb290Lmxlbmd0aCAmJiAoZmlsZXMuZmluZChmID0+IHtcbiAgICByZXR1cm4gXy5pc01hdGNoKGYsIHtyb2xlOiAnd3JhcHBlcicsIGRpclJlc29sdmVkOiBkaXJ9KTtcbiAgfSkgfHwgZ2V0V3JhcHBlcihkaXIsIGZpbGVzLCBzcmNSb290KSk7XG59XG4iXX0=