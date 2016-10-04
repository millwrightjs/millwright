const _ = require('lodash');

_.mixin({attemptSilent, log, logObject, mapAsync, mapAsyncIf});

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

function mapAsync(promise, fn) {
  return promise.then(fn);
}

function mapAsyncIf(promise, cond, fn) {
  return promise.then(result => {
    const shouldMap = typeof cond === 'function' ? cond() : cond;
    return shouldMap ? fn(result) : result;
  });
}
