const _ = require('./lib/lodash-extended');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

const requireDir = require('require-dir');
const plugins = requireDir('./plugins', {camelcase: true});
const config = require('./config');

const mill = {clean, make, build, dev, preview, serve};
const cmd = argv._[0];

module.exports = run;

process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);

function run(cmd) {
  mill[cmd || config.defaultCommand]();
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
  process.env.task = 'build';
  return make();
}

function make() {
  process.env.task = process.env.task || 'make';

  mill.clean();

  const pathsSource = 'src/wrapper.json';
  const assetGroupPaths = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });

  return _(assetGroupPaths)
    .thru(normalize)
    .mapValues(read)
    .mapValues(transpile)
    .mapValues(copySource)
    .mapValuesOn('build', minify)
    .mapValues(remapSources)
    .mapValuesOnWhen('build', 'shouldConcat', concatAssets)
    .mapValues(generateAssets)
    .mapValues(toWebPaths)
    .mapValues(paths => Promise.all(paths))
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

function serve() {
  http.createServer(ecstatic(config.serveRoot)).listen(config.servePort);
  console.log(config.serveMsg);
  open(config.servePath);
}
