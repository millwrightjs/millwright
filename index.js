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
const normalize = requireBuildScript('normalize');

const mill = {
  templateDeps: requireBuildScript('template-deps'),
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
  const assets = fs.readJsonSync('src/wrapper.json');
  const normalized = _.map(assets, normalize);
  mill.clean();
  if (contentfulKeys) {
    const request = contentful.createClient(contentfulKeys).getEntries().then(entries => {
      return mill.pages(_.assign(webPaths, mill.parseContent(entries.items)));
    });
    const templatePromise = mill.templateDeps(assets, optimize);
    return Promise.all([templatePromise, request]);
  }
  mill.pages(webPaths);
  return mill.templateDeps(assets, optimize);
}

function serve() {
  http.createServer(ecstatic(serveRoot)).listen(servePort);
  console.log(serveMsg);
  open(servePath);
}

function requireBuildScript(scriptName) {
  return require(path.resolve(scriptsDir, scriptName + '.js'));
}
