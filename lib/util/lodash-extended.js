const _ = require('lodash');

_.mixin({
  attemptSilent,
  log,
  logObject,
  mapIf,
  mapWhen,
  mapWhenNot,
  mapValuesWhen,
  mapValuesWhenNot,
  mapValuesAsyncWhen,
  mapAsync,
  mapAsyncWhen,
  mapAsyncIf,
});

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

function mapWhen(...args) {
  return mapWhenBase(...args, _.map);
}

function mapWhenNot(...args) {
  return mapWhenBase(...args, _.map, true);
}

function mapValuesWhen(...args) {
  return mapWhenBase(...args, _.mapValues);
}

function mapValuesWhenNot(...args) {
  return mapWhenBase(...args, _.mapValues, true);
}

function mapValuesAsyncWhen(...args) {
  return mapAsyncWhenBase(...args, _.mapValues);
}

function mapWhenBase(coll, cond, fn, mapper, negate) {
  return mapper(coll, (...args) => {
    const val = args[0];
    const condResult = evalCond(val, cond);

    // If negate is true, we want to map only if cond is false.
    if (negate) {
      return condResult ? val : fn(...args);
    }

    // Pass the result of evalCond as the fourth argument to the mapping function.
    return condResult ? fn(...args, condResult) : val;
  });
}

function mapAsync(promise, fn) {
  return promise.then(fn);
}

function mapAsyncWhen(...args) {
  return mapAsyncWhenBase(...args, _.map);
}

function mapAsyncWhenBase(promises, cond, fn, mapper) {
  return mapper(promises, promise => {
    return promise.then(result => {
      return evalCond(result, cond) ? fn(result) : result;
    });
  });
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
