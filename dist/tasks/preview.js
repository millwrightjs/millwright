'use strict';

var build = require('./build');
var serve = require('./serve');

module.exports = preview;

function preview() {
  return build().then(serve);
}