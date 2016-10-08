const _ = require('lodash');

_.mixin({attemptSilent, log, logObject, mapIf, mapWhen, mapAsync, mapAsyncIf});

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

function mapIf(coll, cond, fn) {
  return cond ? _.map(coll, fn) : coll;
}

function mapWhen(coll, cond, fn) {
  return _.map(coll, (...args) => {
    const val = args[0];
    const condResult = evalCond(val, cond);

    // Pass the result of evalCond as the fourth argument to the mapping function
    return condResult ? fn(...args, condResult) : val;
  });
}

function mapAsync(promise, fn) {
  return promise.then(fn);
}

function mapAsyncIf(promise, cond, fn) {
  return promise.then(result => {
    const shouldMap = _.isFunction(cond) ? cond() : cond;
    return shouldMap ? fn(result) : result;
  });
}

function evalCond(val, cond) {
  if (_.isString(cond)) {
    return _.get(val, cond);
  }
  if (_.isFunction(cond)) {
    return cond(val);
  }
  return cond;
}
