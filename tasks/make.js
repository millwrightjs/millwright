const _ = require('../lib/lodash-extended');
const fs = require('fs-extra');
const path = require('path');
const clean = require('./clean');
const config = require('../config');
const contentful = require('contentful');
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});

module.exports = make;

function make() {
  process.env.task = process.env.task || 'make';

  clean();

  const pathsSource = 'src/wrapper.json';
  const assetGroupPaths = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });
  const watchPaths = {};

  return _(assetGroupPaths)
    .thru(normalize)
    .mapValues(read)
    .mapValues(transpile)
    .mapValues(copySource)
    .mapValuesOn('build', minify)
    .mapValues(remapSources)
    .mapValuesOnWhen('build', 'shouldConcat', concatAssets)
    .mapValues(generateAssets)
    .mapValues(_.partial(setWatchPaths, watchPaths))
    .mapValues(toWebPaths)
    .mapValues(paths => Promise.all(paths))
    .resolveAsyncObject()
    .value()
    .then(result => getViews(config.contentful, result));
    .then(() => watchPaths)
}

function normalize(assetGroupPaths) {
  return _(assetGroupPaths)
    .mapValues(plugins.normalizeToObjects)
    .mapValues(plugins.normalizePaths)
    .mapValues(plugins.normalizePathPipelines)
    .mapValues(plugins.normalizeGroups)
    .value();
}

function read(group) {
  const files = _(group.files)
    .mapWhenElse('jsOrCss', plugins.read, (val) => Promise.resolve(val))
    .value();

  return _.assign(group, {files});
}

function transpile(group) {
  const files = _(group.files)
    .mapAsyncWhen('shouldTranspile', plugins.transpile)
    .value();

  return _.assign(group, {files});
}

function minify(group) {
  const files = _(group.files)
    .mapAsyncWhen('shouldMinify', plugins.minify)
    .value();

  return _.assign(group, {files});
}

function copySource(group) {
  const shouldCopySource = process.env.task === 'make' ? 'shouldMinify' : 'jsOrCss';
  const files = _(group.files)
    .mapAsyncWhen(shouldCopySource, plugins.copySource)
    .value();

  return _.assign(group, {files});
}

function remapSources(group) {
  const files = _(group.files)
    .mapAsyncWhen('map', _.curry(plugins.remapSources)(process.env.task))
    .value();

  return _.assign(group, {files});
}

function concatAssets(group) {
  const files = Promise.all(group.files);
  return plugins.concat(_.assign(group, {files}));
}

function generateAssets(group) {
  const shouldOutputSourcemaps = process.env.task === 'make' ? 'shouldMinify' : 'jsOrCss';
  const files = _(group.files)
    .mapAsyncWhen(shouldOutputSourcemaps, plugins.outputSourcemaps)
    .mapAsyncWhenElse('content', plugins.output, plugins.copy)
    .value();

  return _.assign(group, {files});
}

function setWatchPaths(watchPaths, group) {

  // We have to tap into the promise chain, so we'll need to return a promise
  // like other plugins, even though our operations won't be async

  const files = _(group.files)
    .forEach(file => {
      if (file.mapImports) {

    .mapAsync(obj => console.log(obj.destPath, obj.mapImports))
    .value();

  return _.assign(group, {files});
}

function toWebPaths(group) {
  const files = _(group.files)
    .mapAsyncWhenFilter('webPath', plugins.toWebPath)
    .value();

  return files;
}

function getViews(keys, assetPaths) {
  return keys ? getContent(keys, assetPaths) : plugins.pages(assetPaths);
}

function getContent(keys, assetPaths) {
  return contentful.createClient(keys).getEntries().then(entries => {
    return plugins.pages(_.assign(assetPaths, plugins.parseContent(entries.items)));
  });
}
