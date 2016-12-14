const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const config = require('../config');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const {getType, stripIgnoredBasePath, changeExt} = require('../utils/util');

module.exports = normalize;

function normalize(paths) {
  const task = process.env.task || 'make';
  const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
  const srcDirResolved = path.resolve(config.srcDir);

  return _(paths)
    .filter(src => {
      return !activeAssetTypes.includes(_.trimStart(path.extname(src), '.'));
    })
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
      normalized.srcStripped = stripIgnoredBasePath(src, config.templateIgnoredBasePaths);

      if (type === 'mustache') {
        if (parentDir === 'partials') {
          normalized.role = 'partial';
        } else if (name === 'wrapper') {
          normalized.role = 'wrapper';
        } else {
          normalized.role = 'template';
          normalized.dest = path.join(config.destBase, changeExt(normalized.srcStripped, '.html'));
        }
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
          file.wrapper = wrapper.src;
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
      if (!file.role) {
        file.role = 'file';
      }
      if (file.role === 'data') {
        file.content = fs.readJsonSync(file.src);
      }
      return file;
    })
    .map(file => {
      if (file.role === 'data' && file.content.files) {
        file.content.files = _.mapValues(file.content.files, (group, key) => {
          return _(group)
            .map((dep, index, deps) => {
              const result = plugins.normalizePaths({
                role: 'dep',
                path: path.normalize(path.join(file.dir, dep)),
                data: file.srcResolved,
                forWrapper: file.name === 'wrapper',
                baseDir: file.dir,
                groupKey: key
              });
              cache.push('deps', result);
              return result[task === 'build' ? 'groupWebPath' : 'webPath'];
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
