const _ = require('lodash');

_.mixin({uncastArray, attemptSilent});

module.exports = _;

function uncastArray(value) {
  return _.isArray(value) && value.length === 1 ? value[0] : value;
}

function attemptSilent(fn, ...args) {
  const result = _.attempt(fn, ...args);
  return result instanceof Error ? undefined : result;
}
