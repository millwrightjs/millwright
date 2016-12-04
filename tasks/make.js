const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const clean = require('./clean');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);

module.exports = make;

function make(opts = {}) {

  const watch = process.env.watch;
  const task = process.env.task || 'make';
  const watchFiles = {};

  if (!watch) {
    clean();
  }

  const templates = _(plugins.getTemplatePaths())
    .pipeAll(plugins.normalizeTemplatePaths)
    .pipeLog()
    .value();

  /*
  return _(opts.paths || plugins.getSources)
    .pipeLog()
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
  */
}

