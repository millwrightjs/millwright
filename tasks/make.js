const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');
const config = require('../config');

module.exports = make;

function make(opts = {}) {

  const watch = process.env.watch;
  const task = process.env.task || 'make';
  const watchFiles = {};

  if (watch) {
    const assets = opts.paths.map(asset => {
      const props = {
        basePath: path.dirname(asset.data),
        wrapper: path.basename(asset.data, '.json') === 'wrapper'
      }
      return _.assign({}, asset, props);
    });
    return runGenerateAssets(assets);
  }

  clean();
  const srcFiles = plugins.normalize(fs.walkSync(config.srcDir));
  //cache.set(srcFiles);

  const copyPassiveAssets = _.filter(srcFiles, {role: 'file'}).map(asset => {
    const dest = path.join(config.destBase, asset.srcStripped);
    return fs.copy(asset.src, dest);
  });

  srcFiles.forEach(plugins.static);

  const generateAssets = runGenerateAssets(_.filter(srcFiles, {role: 'dep'}));

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

