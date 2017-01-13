const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const pathExists = require('path-exists').sync;
const config = require('../config');
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});
const cache = require('../utils/cache');
const {getType, stripIgnoredBasePath, changeExt, getCompiledType} = require('../utils/util');

module.exports = normalize;

function normalize(paths) {
  const task = process.env.task || 'make';
  const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
  const srcDirResolved = path.resolve(config.srcDir);

  return _(paths)
    .map(src => {
      const srcResolved = path.resolve(src);
      const dirResolved = path.dirname(srcResolved);
      const normalized = path.parse(src);
      const {dir, base, ext, name} = normalized;
      const type = _.trimStart(ext, '.');
      const parentDir = dir.slice(dir.lastIndexOf(path.sep) + path.sep.length);

      normalized.src = src;
      normalized.srcResolved = srcResolved;
      normalized.dirResolved = dirResolved;
      normalized.srcStripped = stripIgnoredBasePath(src, config.assetIgnoredBasePaths);

      if (type === 'mustache') {
        if (parentDir === 'partials') {
          normalized.role = 'partial';
        } else if (name === 'wrapper') {
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
    })
    .map((file, index, files) => {
      if (file.role === 'wrapper') {
        const data = _.find(files, {srcResolved: changeExt(file.srcResolved, '.json')});
        if (data) {
          data.role = 'data';
          file.data = data.srcResolved;
        }
      }

      return file;
    })
    .map((file, index, files) => {
      if (file.role === 'template') {
        const wrapper = getWrapper(file.srcResolved, files, srcDirResolved);
        if (wrapper) {
          file.wrapper = wrapper.srcResolved;
          file.wrapperData = wrapper.data;
        }
        const data = _.find(files, {src: changeExt(file.src, '.json')});
        if (data) {
          data.role = 'data';
          file.data = data.srcResolved;
        }
      }

      return file;
    })
    .map(file => {
      if (file.role === 'data') {
        file.content = fs.readJsonSync(file.src);
      }
      return file;
    })
    .map(file => {
      if (file.role === 'data' && file.content.assets) {
        file.content.assets = _.mapValues(file.content.assets, (group, key) => {
          return _(group).map(dep => {
            const depIsUrl = ['http://', 'https://', '//'].find(str => dep.startsWith(str));
            if (depIsUrl) {
              return dep;
            }
            let src = path.join(file.dir, dep);
            let ref = path.parse(src);

            // Swap in minified src when appropriate (and if exists)
            const compiledType = getCompiledType(getType(ref.ext));
            if (!ref.name.endsWith('.min') && !compiledType) {
              const srcMinSuffix = ['.min', '-min'].find(suffix => {
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
    })
    .value();
}

function getWrapper(ref, files, srcRoot) {
  const dir = path.dirname(ref);
  return dir.length >= srcRoot.length && (files.find(f => {
    return _.isMatch(f, {role: 'wrapper', dirResolved: dir});
  }) || getWrapper(dir, files, srcRoot));
}

