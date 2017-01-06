'use strict';

var make = require('./make');
var serve = require('./serve');

module.exports = dev;

function dev() {
  return make().then(serve);
}