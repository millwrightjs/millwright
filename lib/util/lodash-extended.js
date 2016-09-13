const _ = require('lodash');

_.mixin({attemptSilent, log, logObject});

module.exports = _;

function attemptSilent(fn, ...args) {
  const result = _.attempt(fn, ...args);
  return result instanceof Error ? undefined : result;
}

function log(value) {
  console.log(value);
  return value;
}

function logObject(value) {
  console.log(JSON.stringify(value, null, 2));
  return value;
}
