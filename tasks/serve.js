const http = require('http');
const ecstatic = require('ecstatic');
const opn = require('opn');
const config = require('../config');

module.exports = serve;

function serve() {
  http.createServer(ecstatic(config.serveRoot)).listen(config.servePort);
  console.log(config.serveMsg);
  opn(config.servePath);
}
