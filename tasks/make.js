const _ = require('../lib/lodash-extended');
const fs = require('fs-extra');
const path = require('path');
const clean = require('./clean');
const config = require('../config');
const contentful = require('contentful');
const requireDir = require('require-dir');
const plugins = _.mapValues(requireDir('../plugins', {camelcase: true}), _.curry);

module.exports = make;

function make(opts) {
  if (opts && opts.watch) {
    return generateAssets(opts.paths, true);
  }

  else {
    clean();

    const pathsSource = 'src/wrapper.json';
    const assetGroups = _.mapValues(fs.readJsonSync(pathsSource), paths => {
      return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
    });

    const assets = _(assetGroups)
      .map((assetGroup, groupKey) => _.map(assetGroup, path => ({groupKey, path}))).flatten().value();

    return generateAssets(assets);
  }
}

function generateAssets(assets, watch) {
  const task = process.env.task = process.env.task || 'make';

  const watchFiles = {};

  const assetsGenerated = _(assets)
    .map(plugins.normalizePaths)
    .mapIf(plugins.read, a => a.isCode)
    .mapIf(plugins.promisify, a => !a.isCode)
    .mapAsyncIf(plugins.transpile, a => a.isCode)
    .mapAsyncIf(plugins.copySource, a => a.isCode)
    .mapAsyncWhenIf(plugins.minify, task === 'build', a => a.isCode)
    .mapAsyncIf(plugins.remapSources(task), a => a.isCode && a.map)
    .thruAsyncWhen(plugins.concat, task === 'build')
    .mapAsyncIf(plugins.outputSourcemaps, a => a.isCode)
    .mapAsyncIf(plugins.output, a => a.isCode)
    .mapAsyncIf(plugins.copy, a => !a.isCode)
    .tapAsyncWhen(plugins.getWatchFiles(watchFiles), task === 'make' && !watch)
    .thruAsyncWhen(plugins.toWebPaths, !watch)
    .mapAsyncWhen(plugins.toDestPath, watch)
    .value();

  if (watch) {
    return assetsGenerated[0];
  }

  else {
    return assetsGenerated
      .then(result => {
        if (result.then) {
          return result.then(result => getViews(config.contentful, result));
        }
        return getViews(config.contentful, result);
      })
      .then(result => {
        if (_.has(result, 'then')) {
          return result.then(() => task === 'make' ? {watchFiles} : null);
        }
        return task === 'make' ? {watchFiles} : null;
      });
  }
}

function getViews(keys, assetPaths) {
  return keys ? getContent(keys, assetPaths) : plugins.pages(assetPaths);
}

function getContent(keys, assetPaths) {
  return contentful.createClient(keys).getEntries().then(entries => {
    return plugins.pages(_.assign(assetPaths, plugins.parseContent(entries.items, false)));
  });
}
