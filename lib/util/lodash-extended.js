const _ = require('lodash');

_.mixin({uncastArray, attemptSilent, mapper});

module.exports = _;

function uncastArray(value) {
  return _.isArray(value) && value.length === 1 ? value[0] : value;
}

function attemptSilent(fn, ...args) {
  const result = _.attempt(fn, ...args);
  return result instanceof Error ? undefined : result;
}

function mapper(fn) {
  return (...args) => _.isArray(args[0]) ?  _.map(args[0], (...a) => fn(...a)) : fn(...args);
}
