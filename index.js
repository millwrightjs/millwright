const _ = require('./lib/util/lodash-extended');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

const configPath = path.join(process.cwd(), 'millwright.json');
const config = _.attemptSilent(fs.readJsonSync, configPath);

const cleanDirs = ['dest'];
const scriptsDir = path.join(__dirname, 'lib');
const contentfulKeys = _.get(config, 'contentful');
const serveRoot = 'dest';
const servePort = 8080;
const servePath = 'http://localhost:8080'
const serveMsg = 'Millwright serving at ' + servePath + '...';
const defaultCommand = 'dev';
const normalizeToObjects = requireBuildScript('normalize-to-objects');
const normalizePaths = requireBuildScript('normalize-paths');
const normalizePathPipelines = requireBuildScript('normalize-path-pipelines');
const normalizeGroups = requireBuildScript('normalize-groups');
const read = requireBuildScript('plugins/read');
const compile = requireBuildScript('plugins/compile');
const postProcess = requireBuildScript('plugins/post-process');
const output = requireBuildScript('plugins/output');
const copy = requireBuildScript('plugins/copy');
const toWebPath = requireBuildScript('plugins/to-web-path');

const mill = {
  parseContent: requireBuildScript('parse-content'),
  pages: requireBuildScript('pages'),
  clean,
  make,
  build,
  dev,
  preview,
  serve
};

const cmd = argv._[0];

module.exports = runMill;

function runMill(cmd) {
  if (!cmd) {
    mill[defaultCommand]();
  } else if (_.isString(cmd) && mill[cmd]) {
    mill[cmd]();
  } else if (_.isString(cmd)) {
    console.log('mill: "' + cmd + '" is not a recognized command.');
  }
}

function clean() {
  cleanDirs.forEach(dir => fs.removeSync(dir));
}

function dev() {
  make().then(() => mill.serve());
}

function preview() {
  build().then(() => mill.serve());
}

function build() {
  return make(true);
}

function make(optimize) {
  mill.clean();

  const assetGroups = fs.readJsonSync('src/wrapper.json');
  const assets = {};

  assets.groups = _(assetGroups)
    .mapValues(normalizeToObjects)
    .mapValues(normalizePaths)
    .mapValues(normalizePathPipelines)
    .mapValues(normalizeGroups)
    .mapValues(group => _(group.files)
      .mapWhenElse('isFile', read, (val) => Promise.resolve(val))
      .mapAsyncWhen(['isFile', 'shouldCompile'], compile)
      .mapAsyncWhen(['isFile', 'shouldPostProcess'], postProcess)
      .mapAsyncWhenElse('content', output, copy)
      .mapAsyncWhen('webPath', toWebPath)
      .thru(val => Promise.all(val))
      .value()
    )
    .toPairs()
    .unzip()
    .value();

  const assetGroupKeys = assets.groups[0];
  const assetGroupValues = assets.groups[1];

  // TODO: We're waiting to compile the views, including initializing the CMS get request, until
  // asset processing is complete. The two should be happening simultaneously.

  return Promise.all(assetGroupValues)
    .then(result => assets.groups = _.zipObject(assetGroupKeys, result))
    .then(result => getViews(contentfulKeys, result));

  function getViews(keys, assetPaths) {
    return contentfulKeys ? getContent(keys, assetPaths) : mill.pages(assetPaths);
  }

  function getContent(keys, assetPaths) {
    return contentful.createClient(keys).getEntries().then(entries => {
      return mill.pages(_.assign(assetPaths, mill.parseContent(entries.items)));
    });
  }
}

function serve() {
  http.createServer(ecstatic(serveRoot)).listen(servePort);
  console.log(serveMsg);
  open(servePath);
}

function requireBuildScript(scriptName) {
  return require(path.resolve(scriptsDir, scriptName + '.js'));
}
