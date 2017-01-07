'use strict';

var path = require('path');
var _ = require('lodash');
var promisify = require('promisify-node');
var fs = promisify(require('fs-extra'));
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
  var activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
  var srcDirResolved = path.resolve(config.srcDir);

  return _(paths).map(function (src) {
    var srcResolved = path.resolve(src);
    var dirResolved = path.dirname(srcResolved);
    var normalized = path.parse(src);
    var dir = normalized.dir,
        base = normalized.base,
        ext = normalized.ext,
        name = normalized.name;

    var type = _.trimStart(ext, '.');
    var parentDir = dir.slice(dir.lastIndexOf(path.sep) + path.sep.length);

    normalized.src = src;
    normalized.srcResolved = srcResolved;
    normalized.dirResolved = dirResolved;
    normalized.srcStripped = stripIgnoredBasePath(src, config.templateIgnoredBasePaths);

    if (type === 'mustache') {
      if (parentDir === 'partials') {
        normalized.role = 'partial';
      } else if (name === 'wrapper') {
        normalized.role = 'wrapper';
      } else {
        normalized.role = 'template';
        normalized.dest = path.join(config.destBase, changeExt(normalized.srcStripped, '.html'));
        normalized.destResolved = path.resolve(normalized.dest);
      }
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
          var depIsUrl = ['http://', 'https://', '//'].find(function (str) {
            return dep.startsWith(str);
          });
          if (depIsUrl) {
            return dep;
          }
          var src = path.join(file.dir, dep);
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