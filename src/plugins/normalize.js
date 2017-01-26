const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const pathExists = require('path-exists').sync;
const config = require('../config');
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});
const cache = require('../utils/cache');
const {getType, stripIgnoredBasePath, changeExt, getCompiledType} = require('../utils/util');

module.exports = normalize;

function normalizeBase(src) {
  const normalized = path.parse(src);
  normalized.src = src;
  normalized.srcResolved = path.resolve(src);
  normalized.dirResolved = path.dirname(normalized.srcResolved);
  normalized.srcStripped = stripIgnoredBasePath(src, config.assetIgnoredBasePaths);

  return normalized;
}

function normalize(paths) {
  const task = process.env.task || 'make';
  const srcDirResolved = path.resolve(config.srcDir);

  return _(paths)
    .map(src => {
      const normalized = normalizeBase(src);
      const type = _.trimStart(normalized.ext, '.');
      const parentDir = normalized.dir.slice(normalized.dir.lastIndexOf(path.sep) + path.sep.length);

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
            const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
            const depIsUrl = ['http://', 'https://', '//'].find(str => dep.startsWith(str));

            if (depIsUrl) {
              return dep;
            }

            let src = path.join(file.dir, dep);

            // Cache non-assets as files without roles - this allows copying of arbitrary files from
            // above the src directory, eg. font files from the font-awesome npm package
            const type = path.extname(dep).slice(1);
            if (!activeAssetTypes.includes(type)) {
              const normalized = normalizeBase(src);
              cache.set('files', 'srcResolved', normalized);
              return path.join(config.destDir, normalized.srcStripped);
            }

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
