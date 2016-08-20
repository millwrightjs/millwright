#!/usr/bin/env node

const _ = require('lodash');
const argv = require('yargs').argv;
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const open = require('open');
const ecstatic = require('ecstatic');
const contentful = require('contentful');

const cleanDirs = ['dest'];
const scriptsDir = 'lib';
const contentfulKeys = {
  space: 'gr1u19q56bq9',
  accessToken: 'f2db88fdfe972c971148ee480bf042d7848b28b167a56f69bd37deb05852eb66'
};
const serveRoot = 'dest';
const servePort = 8080;
const servePath = 'http://localhost:8080'
const serveMsg = 'Millwright serving at ' + servePath + '...';
const defaultCommand = 'dev';

const mill = {
  templateDeps: requireBuildScript('template-deps'),
  parseContent: requireBuildScript('parse-content'),
  pages: requireBuildScript('pages'),
  clean,
  build,
  dev,
  serve
};

const cmd = argv._[0];

if (!cmd) {
  mill[defaultCommand]();
} else if (_.isString(cmd) && mill[cmd]) {
  mill[cmd]();
} else if (_.isString(cmd)) {
  console.log('mill: "' + cmd + '" is not a recognized command.');
}

function clean() {
  cleanDirs.forEach(dir => fs.removeSync(dir));
}

function build() {
  return contentful.createClient(contentfulKeys).getEntries().then(entries => {
    return mill.pages(_.assign(mill.templateDeps(), mill.parseContent(entries.items)));
  });
}

function dev() {
  mill.build().then(() => mill.serve());
}

function serve() {
  http.createServer(ecstatic(serveRoot)).listen(servePort);
  console.log(serveMsg);
  open(servePath);
}

function requireBuildScript(scriptName) {
  return require(path.resolve(scriptsDir, scriptName + '.js'));
}
