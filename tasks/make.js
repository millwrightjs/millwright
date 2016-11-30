const _ = require('lodash');
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);

module.exports = make;

function make(opts) {
  clean();

  opts = opts || {};
  const {paths, watch} = opts;
  const task = process.env.task = process.env.task || 'make';

  const watchFiles = {};

  return _(paths || plugins.getAssets())
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
    .pipeTap(plugins.getWatchFiles(watchFiles), task === 'make' && !watch)
    .pipeAll(plugins.toWebPaths, !watch)
    .pipe(plugins.toDestPath, watch)
    .pipeAll(plugins.static(task === 'make' ? {watchFiles} : null), !watch)
    .value();
}

