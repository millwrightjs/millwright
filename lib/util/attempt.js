const _ = require('lodash');

module.exports = attempt;

function attempt(fn, ...args) {
  const result = _.attempt(fn, ...args);
  return result instanceof Error ? undefined : result;
}