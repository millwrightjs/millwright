const _ = require('./lib/lodash-extended');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

const appModulePath = require('app-module-path');
const requireDir = require('require-dir');
const plugins = requireDir('./plugins', {camelcase: true});
const config = require('./config');

const mill = {clean, make, build, dev, preview, serve};
const cmd = argv._[0];

module.exports = run;

function run(cmd) {
  cmd = cmd || config.defaultCommand;
  mill[cmd]();
}

function clean() {
  fs.removeSync(config.destBase);
}

function dev() {
  make().then(mill.serve);
}

function preview() {
  build().then(mill.serve);
}

function build() {
  mill.clean();

  const pathsSource = 'src/wrapper.json';
  const assetGroupPaths = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });

  return _(assetGroupPaths)
    .thru(normalize)
    .mapValues(prepareAssets)
    .mapValues(optimizeAssets)
    .mapValues(copySource)
    .mapValuesWhen('shouldConcat', concatAssets)
    .mapValues(generateAssets)
    .mapValues(toWebPaths)
    .value()
    /*
    .then(result => getViews(config.contentful, result));
   */

}

function make() {
  mill.clean();

  const pathsSource = 'src/wrapper.json';
  const assetGroupPaths = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });

  return _(assetGroupPaths)
    .thru(normalize)
    .mapValues(prepareAssets)
    .mapValues(generateAssets)
    .mapValues(toPromise)
    .resolveAsyncObject()
    .value()
    .then(result => getViews(config.contentful, result));
}

function normalize(assetGroupPaths) {
  return _(assetGroupPaths)
    .mapValues(plugins.normalizeToObjects)
    .mapValues(plugins.normalizePaths)
    .mapValues(plugins.normalizePathPipelines)
    .mapValues(plugins.normalizeGroups)
    .value();
}

function prepareAssets(group) {
  const files = _(group.files)
    .mapWhenElse('isFile', plugins.read, (val) => Promise.resolve(val))
    .mapAsyncWhen(['isFile', 'shouldCompile'], plugins.compile)
    .mapAsyncWhen(['isFile', 'shouldPostProcess'], plugins.postProcess)
    .value();

  return _.assign(group, {files});
}

function optimizeAssets(group) {
  const files = _(group.files)
    .mapAsyncWhen(['isFile', 'shouldMinify'], plugins.minify)
    .value();

  return _.assign(group, {files});
}

function copySource(group) {
  const files = _(group.files)
    .mapAsyncWhen(['isFile', 'shouldCopySource'], plugins.copySource)
    .value();

  return _.assign(group, {files});
}

function concatAssets(group) {
  const files = Promise.all(group.files);
  return plugins.concat(_.assign(group, {files}));
}

    /*
    .mapValues(promiseAllFiles)
    .mapValuesWhenElse('shouldConcat', plugins.concat)
    .mapValues(group => _.assign(group, {files: [group.files]}))
    .mapValues(promiseAllFiles)
    .resolveAsyncObject()
   */

function generateAssets(group) {
  const files = _(group.files)
    .mapAsyncWhen('map', plugins.outputSourcemaps)
    .mapAsyncWhenElse('content', plugins.output, plugins.copy)
    .value();

  return _.assign(group, {files});
}

function toWebPaths(group) {
  const files = _(group.files)
    .mapAsyncWhenFilter('webPath', plugins.toWebPath)
    .value();

  return files;
}

function promiseAllFiles(files) {
  const promise = Promise.all(files);
  const result = _.assign(group, {files: promise});
  return result;
}

function getViews(keys, assetPaths) {
  return keys ? getContent(keys, assetPaths) : plugins.pages(assetPaths);
}

function getContent(keys, assetPaths) {
  return contentful.createClient(keys).getEntries().then(entries => {
    return plugins.pages(_.assign(assetPaths, plugins.parseContent(entries.items)));
  });
}

function serve() {
  http.createServer(ecstatic(config.serveRoot)).listen(config.servePort);
  console.log(config.serveMsg);
  open(config.servePath);
}
