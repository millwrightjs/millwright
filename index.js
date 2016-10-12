const _ = require('./lib/util/lodash-extended');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

require('app-module-path').addPath(path.join(__dirname, 'lib'));
const requireDir = require('require-dir');

const lib = requireDir('./lib', {camelcase: true});
const plugins = requireDir('./lib/plugins', {camelcase: true});
const config = require('./config');

const mill = {parseContent, pages, clean, make, build, dev, preview, serve};
const cmd = argv._[0];

module.exports = runMill;

function runMill(cmd) {
  cmd = cmd || config.defaultCommand;
  mill[cmd]();
}

function parseContent(...args) {
  return lib.parseContent(...args);
}

function pages(...args) {
  return lib.pages(...args);
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
  return make();
}

function make() {
  mill.clean();

  const pathsSource = 'src/wrapper.json';
  const assetGroupPaths = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });

  return _(assetGroupPaths)
    .thru(normalize)
    .mapValues(generateAssets)
    .resolveAsyncObject()
    .value()
    .then(result => getViews(config.contentful, result));

  function getViews(keys, assetPaths) {
    return keys ? getContent(keys, assetPaths) : mill.pages(assetPaths);
  }

  function getContent(keys, assetPaths) {
    return contentful.createClient(keys).getEntries().then(entries => {
      return mill.pages(_.assign(assetPaths, mill.parseContent(entries.items)));
    });
  }
}

function normalize(assetGroupPaths) {
  return _(assetGroupPaths)
    .mapValues(lib.normalizeToObjects)
    .mapValues(lib.normalizePaths)
    .mapValues(lib.normalizePathPipelines)
    .mapValues(lib.normalizeGroups)
    .value();
}

function generateAssets(group) {
  return _(group.files)
    .mapWhenElse('isFile', plugins.read, (val) => Promise.resolve(val))
    .mapAsyncWhen(['isFile', 'shouldCompile'], plugins.compile)
    .mapAsyncWhen(['isFile', 'shouldPostProcess'], plugins.postProcess)
    .mapAsyncWhenElse('content', plugins.output, plugins.copy)
    .mapAsyncWhenFilter('webPath', plugins.toWebPath)
    .thru(val => Promise.all(val))
    .value();
}

function serve() {
  http.createServer(ecstatic(config.serveRoot)).listen(config.servePort);
  console.log(config.serveMsg);
  open(config.servePath);
}
