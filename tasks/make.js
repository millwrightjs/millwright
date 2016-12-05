const _ = require('lodash');
const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);
const cache = require('../utils/cache');

module.exports = make;

function make(opts = {}) {

  const watch = process.env.watch;
  const task = process.env.task || 'make';
  const watchFiles = {};

  if (!watch) {
    clean();
  }

  const templates = plugins.getTemplatePaths();
  templates.data = {};
  templates.templateDataPaths.forEach(val => cache[val] = fs.readJsonSync(val));

  templates.data = _.mapValues(templates.data, (value, key) => {
    const basePath = path.dirname(key);

    if (_.has(value, 'files')) {
      value.files = _(value.files).map((group, groupKey) => {
        return _.map(group, assetPath => {
          return plugins.normalizePaths({
            path: path.normalize(path.join(basePath, assetPath)),
            groupKey
          });
        });
      }).flatten().value();
    }

    return value;
  });

  const assetPaths = opts.paths || _(templates.data).map('files').flatten().value();

  const generateTemplates = _(templates)
    .pipeAll(plugins.normalizeTemplatePaths)
    .pipe(plugins.static)
    .value();

  const generateAssets = _(assetPaths)
    .pipe(plugins.normalizePaths)
    .pipe(plugins.read, a => a.isCode)
    .pipe(plugins.promisify, a => !a.isCode)
    .pipe(plugins.transpile, a => a.isCode && !a.isMinified)
    .pipe(plugins.copySource, a => a.isCode)
    .pipe(plugins.minify, a => a.isCode && !a.isMinified, task === 'build')
    .pipe(plugins.remapSources(task), a => a.isCode && a.map)
    .pipeAll(plugins.concat, task === 'build')
    .pipe(plugins.outputSourcemaps, a => a.isCode)
    .pipe(plugins.output, a => a.isCode)
    .pipe(plugins.copy, a => !a.isCode)
    //.pipeTap(plugins.getWatchFiles(watchFiles), task === 'make' && !watch)
    //.pipe(plugins.toDestPath, watch)
    .value();

  return Promise.all([generateTemplates, generateAssets]);
}

