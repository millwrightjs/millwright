const _ = require('lodash');

_.mixin({
  attemptSilent,
  isPromise,
  pipe,
  pipeAll,
  pipeTap,
  pipeLog
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

function isPromise(value) {
  return !!_.get(value, 'then');
}

function pipe(coll, fn, cond, when) {
  if (arguments.length === 3) {
    _.isFunction(cond) ? when = true : (when = cond, cond = _.stubTrue);
  } else if (arguments.length === 2) {
    when = true, cond = _.stubTrue;
  }

  if (!when) {
    return coll;
  }

  const pipeValues = _.curry((coll, fn, cond) => {
    return _.map(coll, value => {
      if (isPromise(value)) {
        return value.then(val => cond(val) ? fn(val) : val);
      }
      return cond(value) ? fn(value) : value;
    });
  });

  return isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function pipeAll(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    return isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeTap(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeLog(coll) {
  const log = vals => _.map(vals, val => isPromise(val) ? val.then(console.log) : console.log(val));
  isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}
