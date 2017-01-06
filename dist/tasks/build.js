'use strict';

var make = require('./make');

module.exports = build;

function build() {
  process.env.task = 'build';
  return make();
}