const _ = require('lodash');

_.mixin({
  attemptSilent,
  log,
  logAsync,
  logObject,
  isPromise,
  resolveAsyncObject,
  forEachAsyncWhen,
  mapIf,
  mapAsync,
  mapAsyncWhen,
  mapAsyncIf,
  mapAsyncWhenIf,
  thruAsync,
  thruWhen,
  thruAsyncWhen,
  tapAsyncWhen,
  mapWhen,
  mapWhenNot,
  mapWhenElse,
  mapValuesOn,
  mapValuesOnWhen,
  mapValuesWhen,
  mapValuesWhenNot,
  mapValuesWhenElse,
  mapValuesAsyncWhen,
  mapAsyncWhenFilter,
  mapAsyncWhenElse,
  thenMapValues,
  thenMapValuesWhen,
  thruIf,
  thruIfElse
});

module.exports = _;

function attemptSilent(fn, ...args) {
  const result = _.attempt(fn, ...args);
  if (isPromise(result)) {
    return result.catch(_.noop);
  }

  else if (!(result instanceof Error)) {
    return result;
  }
}

function log(value) {
  console.log(value);
  return value;
}

function logAsync(promise) {
  return promise.then(console.log);
}

function logObject(value) {
  console.log(JSON.stringify(value, null, 2));
  return value;
}

function isPromise(value) {
  return !!_.get(value, 'then');
}

function resolveAsyncObject(obj) {
  const [keys, values] = _(obj).toPairs().unzip().value();
  return Promise.all(values).then(result => _.zipObject(keys, result));
}

function forEachAsyncWhen(coll, fn, cond) {
  if (cond && isPromise(coll)) {
    coll.then(results => _.forEach(results, result => {
      isPromise(result) ? result.then(fn) : fn(result);
    }));
  }

  else if (cond) {
    _.forEach(coll, val => val.then(fn));
  }

  return coll;
}

function mapIf(coll, fn, cond) {
  return _.map(coll, val => cond(val) ? fn(val) : val);
}

function mapAsync(coll, fn) {
  if (isPromise(coll)) {
    return coll.then(results => {
      _.map(results, result => isPromise(result) ? result.then(val => fn(val)) : fn(val));
    });
  }
  return _.map(coll, val => val.then(result => fn(result)));
}

function mapAsyncWhen(coll, fn, when) {
  return when ? mapAsync(coll, fn) : coll;
}

function mapAsyncIf(coll, fn, cond) {
  if (isPromise(coll)) {
    return coll.then(results => _.map(results, result => {
      if (isPromise(result)) {
        return result.then(val => cond(val) ? fn(val) : val);
      }
      return cond(result) ? fn(result) : result;
    }));
  }
  return _.map(coll, val => val.then(result => cond(result) ? fn(result) : result));
}

function mapAsyncWhenIf(coll, fn, when, cond) {
  return when ? mapAsyncIf(coll, fn, cond) : coll;
}

function thruAsync(coll, fn) {
  if (isPromise(coll)) {
    return coll.then(result => fn(result));
  }
  return Promise.all(_.castArray(coll)).then(result => fn(result));
}

function thruWhen(coll, fn, when) {
  return when ? fn(coll) : coll;
}

function thruAsyncWhen(coll, fn, when) {
  return when ? thruAsync(coll, fn) : coll;
}

function tapAsyncWhen(coll, fn, when) {
  if (when) {
    Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function mapWhen(...args) {
  return mapWhenBase(...args, _.map);
}

function mapWhenNot(...args) {
  return mapWhenBase(...args, _.map, {negate: true});
}

function mapWhenElse(...args) {
  return mapWhenBase(...args, _.map);
}

function mapValuesOn(...args) {
  return mapValuesOnBase(...args, _.mapValues);
}

function mapValuesOnWhen(...args) {
  return mapValuesOnBase(...args, _.mapValuesWhen);
}

function mapValuesOnBase(values, taskName, cond, fn, mapper) {
  if (!mapper) {
    mapper = fn, fn = cond;
  }

  return process.env.task === taskName ? mapper(values, cond, fn) : values;
}

function mapValuesWhen(...args) {
  return mapWhenBase(...args, _.mapValues);
}

function mapValuesWhenNot(...args) {
  return mapWhenBase(...args, _.mapValues, {negate: true});
}

function mapValuesWhenElse(...args) {
  return mapWhenBase(...args, _.mapValues);
}

function mapValuesAsyncWhen(...args) {
  return mapAsyncWhenBase(...args, _.mapValues);
}

function mapAsyncWhenFilter(...args) {
  return mapAsyncWhenBase(...args, _.map, {filter: true});
}

function mapAsyncWhenElse(...args) {
  return mapAsyncWhenBase(...args, _.map);
}

function thenMapValues(promise, fn) {
  return promise.then(result => _.mapValues(result, fn));
}

function thenMapValuesWhen(promise, ...args) {
  return promise.then(result => mapValuesWhen(result, ...args));
}

function thruIf(...args) {
  return thruIfBase(...args);
}

function thruIfElse(...args) {
  return thruIfBase(...args);
}

function thruIfBase(val, cond, fn, elseFn) {
  elseFn = elseFn || _.identity;
  const condResult = evalCond(val, cond);
  return condResult ? fn(val, condResult) : elseFn(val);
}

function mapWhenBase(coll, cond, fn, elseFn, mapper, opts) {
  if (!_.isFunction(mapper)) {
    opts = mapper;
    mapper = elseFn;
    elseFn = _.identity;
  }

  if (_.get(opts, 'filter')) {
    elseFn = _.noop;
  }

  return mapper(coll, (...args) => {
    const val = args[0];
    const condResult = evalCond(val, cond);

    // If negate is true, we want to map only if cond is false.
    if (_.get(opts, 'negate')) {
      return condResult ? elseFn(...args) : fn(...args);
    }

    // Pass the result of evalCond as the fourth argument to the mapping function.
    return condResult ? fn(...args, condResult) : elseFn(...args);
  });
}

function mapAsyncWhenBase(promises, cond, fn, elseFn, mapper, opts) {
  if (!_.isFunction(mapper)) {
    opts = mapper;
    mapper = elseFn;
    elseFn = _.identity;
  }

  if (_.get(opts, 'filter')) {
    elseFn = _.noop;
  }

  return mapper(promises, promise => {
    return promise.then(result => {
      return evalCond(result, cond) ? fn(result) : elseFn(result);
    });
  });
}

function evalCond(val, cond) {
  if (_.isArray(cond)) {
    return _.every(cond, c => evalCond(val, c));
  }
  if (_.isString(cond)) {
    return _.get(val, cond);
  }
  if (_.isFunction(cond)) {
    return cond(val);
  }

  return cond;
}
