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

const mill = {parseContent, pages, clean, make, build, dev, preview, serve};
const cmd = argv._[0];

module.exports = runMill;

function runMill(cmd) {
  cmd = cmd || config.defaultCommand;
  mill[cmd]();
}

function parseContent(...args) {
  return plugins.parseContent(...args);
}

function pages(...args) {
  return plugins.pages(...args);
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
    .mapValues(generateAssets)
    .resolveAsyncObject()
    .value()
    .then(result => getViews(config.contentful, result));
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
  return _(group.files)
    .mapWhenElse('isFile', plugins.read, (val) => Promise.resolve(val))
    .mapAsyncWhen(['isFile', 'shouldCompile'], plugins.compile)
    .mapAsyncWhen(['isFile', 'shouldPostProcess'], plugins.postProcess);
}

function optimizeAssets(wrappedGroup) {
  return wrappedGroup;
}

function generateAssets(wrappedGroup) {
  return wrappedGroup
    .mapAsyncWhen('map', plugins.outputSourcemaps)
    .mapAsyncWhenElse('content', plugins.output, plugins.copy)
    .mapAsyncWhenFilter('webPath', plugins.toWebPath);
}

function toPromise(wrappedGroup) {
  return wrappedGroup
    .thru(val => Promise.all(val))
    .value();
}

function getViews(keys, assetPaths) {
  return keys ? getContent(keys, assetPaths) : mill.pages(assetPaths);
}

function getContent(keys, assetPaths) {
  return contentful.createClient(keys).getEntries().then(entries => {
    return mill.pages(_.assign(assetPaths, mill.parseContent(entries.items)));
  });
}

function serve() {
  http.createServer(ecstatic(config.serveRoot)).listen(config.servePort);
  console.log(config.serveMsg);
  open(config.servePath);
}
