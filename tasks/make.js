const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const config = require('../config');
const {getType, stripIgnoredBasePath, changeExt} = require('../utils/util');

module.exports = make;

function make(opts = {}) {

  const watch = process.env.watch;
  const task = process.env.task || 'make';
  const watchFiles = {};

  if (watch) {
    const assets = opts.paths.map(asset => {
      const props = {
        basePath: path.dirname(asset.dataFilePath),
        wrapper: path.basename(asset.dataFilePath, '.json') === 'wrapper'
      }
      return _.assign({}, asset, props);
    });
    return runGenerateAssets(assets);
  }

  clean();
  const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss'];
  const srcDirResolved = path.resolve(config.srcDir);
  const srcFiles = _(fs.walkSync(config.srcDir))
    .filter(src => {
      return !activeAssetTypes.includes(_.trimStart(path.extname(src), '.'));
    })
    .map((src, index, files) => {
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
    .map((file, index, files) => {
      if (!file.role) {
        file.role = 'file';
      }
      if (file.role === 'data') {
        file.content = fs.readJsonSync(file.src);
      }
      return file;
    })
    .reduce((acc, file) => {
      if (file.role === 'data' && file.content.files) {
        const assets = [];
        file.content.files = _.mapValues(file.content.files, (group, key) => {
          return group.reduce((acc, asset, index, coll) => {
            const result = plugins.normalizePaths({
              role: 'dep',
              path: path.normalize(path.join(file.dir, asset)),
              data: file.srcResolved,
              forWrapper: file.name === 'wrapper',
              baseDir: file.dir,
              groupKey: key
            });
            assets.push(result);

            if (task !== 'build') {
              return acc.concat(result.webPath);
            }

            if (index === coll.length - 1) {
              return acc.concat(result.groupWebPath);
            }

            return acc;
          }, []);
        });
        acc = acc.concat(assets);
      }
      return acc.concat(file);
    }, []);

  function getWrapper(ref, files, srcRoot) {
    const dir = path.dirname(ref);
    return dir.length >= srcRoot.length && (files.find(f => {
      return _.isMatch(f, {role: 'wrapper', dirResolved: dir});
    }) || getWrapper(dir, files, srcRoot));
  }

  const copyPassiveAssets = _.filter(srcFiles, {role: 'file'}).map(asset => {
    const dest = path.join(config.destBase, asset.srcStripped);
    return fs.copy(asset.src, dest);
  });

  srcFiles.forEach(plugins.static);

  const generateAssets = runGenerateAssets(_.filter(srcFiles, {role: 'dep'}));

  //console.log(_.filter(srcFiles, {role: 'dep'}));

  function runGenerateAssets(assets) {
    return _(assets)
      .pipe(plugins.normalizePaths, watch)
      .pipe(plugins.read)
      .pipe(plugins.transpile, a => !a.isMinified)
      .pipe(plugins.copySource)
      .pipe(plugins.minify, a => !a.isMinified, task === 'build')
      .pipe(plugins.remapSources(task), a => a.map)
      .pipeAll(plugins.concat, task === 'build')
      .pipe(plugins.outputSourcemaps)
      .pipe(plugins.output)
      .pipeTap(plugins.getWatchFiles(watchFiles), task === 'make' && !watch)
      .pipe(plugins.toDestPath, watch)
      .value();
  }

  return Promise.all(_.flatten([generateAssets, copyPassiveAssets])).then(() => ({watchFiles}));
}

