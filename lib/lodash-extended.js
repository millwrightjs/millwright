const _ = require('lodash');

_.mixin({
  attemptSilent,
  log,
  logAsync,
  isPromise,
  mapIf,
  mapAsync,
  mapAsyncWhen,
  mapAsyncIf,
  mapAsyncWhenIf,
  thruAsync,
  thruAsyncWhen,
  tapAsyncWhen
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

function isPromise(value) {
  return !!_.get(value, 'then');
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

function thruAsyncWhen(coll, fn, when) {
  return when ? thruAsync(coll, fn) : coll;
}

function tapAsyncWhen(coll, fn, when) {
  if (when) {
    Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}
