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

function normalize(paths) {
  var task = process.env.task || 'make';
  var srcDirResolved = path.resolve(config.srcDir);

  return _(paths).map(function (src) {
    var normalized = plugins.normalizeBase(src);
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
          if (activeAssetTypes.indexOf(type) === -1) {
            var normalized = plugins.normalizeBase(src);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL25vcm1hbGl6ZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJmcyIsInBhdGhFeGlzdHMiLCJzeW5jIiwiY29uZmlnIiwicmVxdWlyZURpciIsInBsdWdpbnMiLCJjYW1lbGNhc2UiLCJjYWNoZSIsImdldFR5cGUiLCJzdHJpcElnbm9yZWRCYXNlUGF0aCIsImNoYW5nZUV4dCIsImdldENvbXBpbGVkVHlwZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJub3JtYWxpemUiLCJwYXRocyIsInRhc2siLCJwcm9jZXNzIiwiZW52Iiwic3JjRGlyUmVzb2x2ZWQiLCJyZXNvbHZlIiwic3JjRGlyIiwibWFwIiwibm9ybWFsaXplZCIsIm5vcm1hbGl6ZUJhc2UiLCJzcmMiLCJ0eXBlIiwidHJpbVN0YXJ0IiwiZXh0IiwicGFyZW50RGlyIiwiZGlyIiwic2xpY2UiLCJsYXN0SW5kZXhPZiIsInNlcCIsImxlbmd0aCIsInJvbGUiLCJuYW1lIiwiZGVzdCIsImpvaW4iLCJkZXN0RGlyIiwic3JjU3RyaXBwZWQiLCJkZXN0UmVzb2x2ZWQiLCJmaWxlIiwiaW5kZXgiLCJmaWxlcyIsImRhdGEiLCJmaW5kIiwic3JjUmVzb2x2ZWQiLCJ3cmFwcGVyIiwiZ2V0V3JhcHBlciIsIndyYXBwZXJEYXRhIiwiY29udGVudCIsInJlYWRKc29uU3luYyIsImFzc2V0cyIsIm1hcFZhbHVlcyIsImdyb3VwIiwia2V5IiwiYWN0aXZlQXNzZXRUeXBlcyIsImRlcElzVXJsIiwiZGVwIiwic3RhcnRzV2l0aCIsInN0ciIsImV4dG5hbWUiLCJpbmRleE9mIiwic2V0IiwicmVmIiwicGFyc2UiLCJjb21waWxlZFR5cGUiLCJlbmRzV2l0aCIsInNyY01pblN1ZmZpeCIsInN1ZmZpeCIsImlzTWluaWZpZWQiLCJjb25zdW1lciIsImdyb3VwS2V5IiwicHVzaCIsImdldFdlYlBhdGgiLCJ1bmlxIiwidmFsdWUiLCJzcmNSb290IiwiZGlybmFtZSIsImlz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QyxLQUFLa0YsT0FBTCxDQUFhZCxHQUFiLENBQVo7QUFDQSxTQUFPbkMsSUFBSUksTUFBSixJQUFjNEMsUUFBUTVDLE1BQXRCLEtBQWlDVSxNQUFNRSxJQUFOLENBQVcsYUFBSztBQUN0RCxXQUFPL0MsRUFBRWlGLE9BQUYsQ0FBVUMsQ0FBVixFQUFhLEVBQUM5QyxNQUFNLFNBQVAsRUFBa0IrQyxhQUFhcEQsR0FBL0IsRUFBYixDQUFQO0FBQ0QsR0FGdUMsS0FFbENtQixXQUFXbkIsR0FBWCxFQUFnQmMsS0FBaEIsRUFBdUJrQyxPQUF2QixDQUZDLENBQVA7QUFHRCIsImZpbGUiOiJub3JtYWxpemUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuY29uc3QgcGF0aEV4aXN0cyA9IHJlcXVpcmUoJ3BhdGgtZXhpc3RzJykuc3luYztcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuY29uc3QgcmVxdWlyZURpciA9IHJlcXVpcmUoJ3JlcXVpcmUtZGlyJyk7XG5jb25zdCBwbHVnaW5zID0gcmVxdWlyZURpcignLi4vcGx1Z2lucycsIHtjYW1lbGNhc2U6IHRydWV9KTtcbmNvbnN0IGNhY2hlID0gcmVxdWlyZSgnLi4vdXRpbHMvY2FjaGUnKTtcbmNvbnN0IHtnZXRUeXBlLCBzdHJpcElnbm9yZWRCYXNlUGF0aCwgY2hhbmdlRXh0LCBnZXRDb21waWxlZFR5cGV9ID0gcmVxdWlyZSgnLi4vdXRpbHMvdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vcm1hbGl6ZTtcblxuZnVuY3Rpb24gbm9ybWFsaXplKHBhdGhzKSB7XG4gIGNvbnN0IHRhc2sgPSBwcm9jZXNzLmVudi50YXNrIHx8ICdtYWtlJztcbiAgY29uc3Qgc3JjRGlyUmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoY29uZmlnLnNyY0Rpcik7XG5cbiAgcmV0dXJuIF8ocGF0aHMpXG4gICAgLm1hcChzcmMgPT4ge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IHBsdWdpbnMubm9ybWFsaXplQmFzZShzcmMpO1xuICAgICAgY29uc3QgdHlwZSA9IF8udHJpbVN0YXJ0KG5vcm1hbGl6ZWQuZXh0LCAnLicpO1xuICAgICAgY29uc3QgcGFyZW50RGlyID0gbm9ybWFsaXplZC5kaXIuc2xpY2Uobm9ybWFsaXplZC5kaXIubGFzdEluZGV4T2YocGF0aC5zZXApICsgcGF0aC5zZXAubGVuZ3RoKTtcblxuICAgICAgaWYgKHR5cGUgPT09ICdtdXN0YWNoZScpIHtcbiAgICAgICAgaWYgKHBhcmVudERpciA9PT0gJ3BhcnRpYWxzJykge1xuICAgICAgICAgIG5vcm1hbGl6ZWQucm9sZSA9ICdwYXJ0aWFsJztcbiAgICAgICAgfSBlbHNlIGlmIChub3JtYWxpemVkLm5hbWUgPT09ICd3cmFwcGVyJykge1xuICAgICAgICAgIG5vcm1hbGl6ZWQucm9sZSA9ICd3cmFwcGVyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub3JtYWxpemVkLnJvbGUgPSAndGVtcGxhdGUnO1xuICAgICAgICAgIG5vcm1hbGl6ZWQuZGVzdCA9IHBhdGguam9pbihjb25maWcuZGVzdERpciwgY2hhbmdlRXh0KG5vcm1hbGl6ZWQuc3JjU3RyaXBwZWQsICcuaHRtbCcpKTtcbiAgICAgICAgICBub3JtYWxpemVkLmRlc3RSZXNvbHZlZCA9IHBhdGgucmVzb2x2ZShub3JtYWxpemVkLmRlc3QpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdqcycgJiYgcGFyZW50RGlyID09PSAnbGFtYmRhcycpIHtcbiAgICAgICAgbm9ybWFsaXplZC5yb2xlID0gJ2xhbWJkYSc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH0pXG4gICAgLm1hcCgoZmlsZSwgaW5kZXgsIGZpbGVzKSA9PiB7XG4gICAgICBpZiAoZmlsZS5yb2xlID09PSAnd3JhcHBlcicpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IF8uZmluZChmaWxlcywge3NyY1Jlc29sdmVkOiBjaGFuZ2VFeHQoZmlsZS5zcmNSZXNvbHZlZCwgJy5qc29uJyl9KTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICBkYXRhLnJvbGUgPSAnZGF0YSc7XG4gICAgICAgICAgZmlsZS5kYXRhID0gZGF0YS5zcmNSZXNvbHZlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmlsZTtcbiAgICB9KVxuICAgIC5tYXAoKGZpbGUsIGluZGV4LCBmaWxlcykgPT4ge1xuICAgICAgaWYgKGZpbGUucm9sZSA9PT0gJ3RlbXBsYXRlJykge1xuICAgICAgICBjb25zdCB3cmFwcGVyID0gZ2V0V3JhcHBlcihmaWxlLnNyY1Jlc29sdmVkLCBmaWxlcywgc3JjRGlyUmVzb2x2ZWQpO1xuICAgICAgICBpZiAod3JhcHBlcikge1xuICAgICAgICAgIGZpbGUud3JhcHBlciA9IHdyYXBwZXIuc3JjUmVzb2x2ZWQ7XG4gICAgICAgICAgZmlsZS53cmFwcGVyRGF0YSA9IHdyYXBwZXIuZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXRhID0gXy5maW5kKGZpbGVzLCB7c3JjOiBjaGFuZ2VFeHQoZmlsZS5zcmMsICcuanNvbicpfSk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgZGF0YS5yb2xlID0gJ2RhdGEnO1xuICAgICAgICAgIGZpbGUuZGF0YSA9IGRhdGEuc3JjUmVzb2x2ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfSlcbiAgICAubWFwKGZpbGUgPT4ge1xuICAgICAgaWYgKGZpbGUucm9sZSA9PT0gJ2RhdGEnKSB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IGZzLnJlYWRKc29uU3luYyhmaWxlLnNyYyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsZTtcbiAgICB9KVxuICAgIC5tYXAoZmlsZSA9PiB7XG4gICAgICBpZiAoZmlsZS5yb2xlID09PSAnZGF0YScgJiYgZmlsZS5jb250ZW50LmFzc2V0cykge1xuICAgICAgICBmaWxlLmNvbnRlbnQuYXNzZXRzID0gXy5tYXBWYWx1ZXMoZmlsZS5jb250ZW50LmFzc2V0cywgKGdyb3VwLCBrZXkpID0+IHtcbiAgICAgICAgICByZXR1cm4gXyhncm91cCkubWFwKGRlcCA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVBc3NldFR5cGVzID0gWydjc3MnLCAnanMnLCAnY29mZmVlJywgJ2xlc3MnLCAnc3R5bCcsICdzYXNzJywgJ3Njc3MnXTtcbiAgICAgICAgICAgIGNvbnN0IGRlcElzVXJsID0gWydodHRwOi8vJywgJ2h0dHBzOi8vJywgJy8vJ10uZmluZChzdHIgPT4gZGVwLnN0YXJ0c1dpdGgoc3RyKSk7XG5cbiAgICAgICAgICAgIGlmIChkZXBJc1VybCkge1xuICAgICAgICAgICAgICByZXR1cm4gZGVwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgc3JjID0gcGF0aC5qb2luKGZpbGUuZGlyLCBkZXApO1xuXG4gICAgICAgICAgICAvLyBDYWNoZSBub24tYXNzZXRzIGFzIGZpbGVzIHdpdGhvdXQgcm9sZXMgLSB0aGlzIGFsbG93cyBjb3B5aW5nIG9mIGFyYml0cmFyeSBmaWxlcyBmcm9tXG4gICAgICAgICAgICAvLyBhYm92ZSB0aGUgc3JjIGRpcmVjdG9yeSwgZWcuIGZvbnQgZmlsZXMgZnJvbSB0aGUgZm9udC1hd2Vzb21lIG5wbSBwYWNrYWdlXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gcGF0aC5leHRuYW1lKGRlcCkuc2xpY2UoMSk7XG4gICAgICAgICAgICBpZiAoYWN0aXZlQXNzZXRUeXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSkge1xuICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gcGx1Z2lucy5ub3JtYWxpemVCYXNlKHNyYyk7XG4gICAgICAgICAgICAgIGNhY2hlLnNldCgnZmlsZXMnLCAnc3JjUmVzb2x2ZWQnLCBub3JtYWxpemVkKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhdGguam9pbihjb25maWcuZGVzdERpciwgbm9ybWFsaXplZC5zcmNTdHJpcHBlZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCByZWYgPSBwYXRoLnBhcnNlKHNyYyk7XG5cbiAgICAgICAgICAgIC8vIFN3YXAgaW4gbWluaWZpZWQgc3JjIHdoZW4gYXBwcm9wcmlhdGUgKGFuZCBpZiBleGlzdHMpXG4gICAgICAgICAgICBjb25zdCBjb21waWxlZFR5cGUgPSBnZXRDb21waWxlZFR5cGUoZ2V0VHlwZShyZWYuZXh0KSk7XG4gICAgICAgICAgICBpZiAoIXJlZi5uYW1lLmVuZHNXaXRoKCcubWluJykgJiYgIWNvbXBpbGVkVHlwZSkge1xuICAgICAgICAgICAgICBjb25zdCBzcmNNaW5TdWZmaXggPSBbJy5taW4nLCAnLW1pbiddLmZpbmQoc3VmZml4ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aEV4aXN0cyhwYXRoLmpvaW4ocmVmLmRpciwgcmVmLm5hbWUgKyBzdWZmaXggKyByZWYuZXh0KSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAoc3JjTWluU3VmZml4KSB7XG4gICAgICAgICAgICAgICAgcmVmLmlzTWluaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzcmNNaW5TdWZmaXggJiYgcHJvY2Vzcy5lbnYudGFzayA9PT0gJ2J1aWxkJykge1xuICAgICAgICAgICAgICAgIHNyYyA9IHBhdGguam9pbihyZWYuZGlyLCByZWYubmFtZSArIHNyY01pblN1ZmZpeCArIHJlZi5leHQpO1xuICAgICAgICAgICAgICAgIHJlZiA9IHBhdGgucGFyc2Uoc3JjKTtcbiAgICAgICAgICAgICAgICByZWYuaXNNaW5pZmllZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVmLnNyYyA9IHNyYztcbiAgICAgICAgICAgIHJlZi5zcmNSZXNvbHZlZCA9IHBhdGgucmVzb2x2ZShzcmMpO1xuICAgICAgICAgICAgcmVmLmNvbnN1bWVyID0gZmlsZS5zcmNSZXNvbHZlZDtcbiAgICAgICAgICAgIHJlZi5ncm91cEtleSA9IGtleTtcbiAgICAgICAgICAgIHJlZi5yb2xlID0gJ2Fzc2V0JztcbiAgICAgICAgICAgIGNhY2hlLnB1c2goJ2RlcHMnLCByZWYpO1xuICAgICAgICAgICAgcmV0dXJuIHBsdWdpbnMuZ2V0V2ViUGF0aChzcmMsIGZpbGUsIGtleSk7XG4gICAgICAgICAgfSkudW5pcSgpLnZhbHVlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfSlcbiAgICAudmFsdWUoKTtcbn1cblxuXG5mdW5jdGlvbiBnZXRXcmFwcGVyKHJlZiwgZmlsZXMsIHNyY1Jvb3QpIHtcbiAgY29uc3QgZGlyID0gcGF0aC5kaXJuYW1lKHJlZik7XG4gIHJldHVybiBkaXIubGVuZ3RoID49IHNyY1Jvb3QubGVuZ3RoICYmIChmaWxlcy5maW5kKGYgPT4ge1xuICAgIHJldHVybiBfLmlzTWF0Y2goZiwge3JvbGU6ICd3cmFwcGVyJywgZGlyUmVzb2x2ZWQ6IGRpcn0pO1xuICB9KSB8fCBnZXRXcmFwcGVyKGRpciwgZmlsZXMsIHNyY1Jvb3QpKTtcbn1cbiJdfQ==