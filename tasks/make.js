const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const config = require('../config');
const {getType, stripIgnoredBasePath} = require('../utils/util');

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

  const srcFiles = fs.walkSync(config.srcDir);

  const activeAssetTypes = ['css', 'js', 'coffee', 'less', 'styl', 'sass', 'scss', 'mustache', 'json'];
  const passiveAssets = _.remove(srcFiles, val => {
    return !activeAssetTypes.includes(_.trimStart(path.extname(val), '.'));
  });

  const templates = plugins.getTemplatePaths(srcFiles);

  _.forEach(templates.templateDataPaths, val => {
    const basePath = path.dirname(val);
    const wrapper = path.basename(val, '.json') === 'wrapper';

    cache.get(val, data => {
      const files = _(data.files).map((group, groupKey) => {
        return _.map(group, assetPath => {
          const result = plugins.normalizePaths({
            path: path.normalize(path.join(basePath, assetPath)),
            dataFilePath: val,
            basePath,
            groupKey,
            wrapper
          });

          return result;
        });
      }).flatten().value();

      return _.assign({}, data, {files});
    });
  });

  const assetPaths = opts.paths || _(templates.templateDataPaths)
    .map(val => cache.get(val)).map('files').flatten().value();

  const copyPassiveAssets = passiveAssets.map(asset => {
    const dest = path.join(config.destBase, stripIgnoredBasePath(asset, config.templateIgnoredBasePaths));
    return fs.copy(asset, dest);
  });

  const generateTemplates = _(templates)
    .pipeAll(plugins.normalizeTemplatePaths)
    .pipe(plugins.static)
    .value();

  const generateAssets = runGenerateAssets(assetPaths);

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

  return Promise.all(_.flatten([generateAssets, generateTemplates, copyPassiveAssets])).then(() => ({watchFiles}));
}

