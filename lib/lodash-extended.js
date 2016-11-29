const _ = require('lodash');
const ProgressBar = require('progress');
const bar = new ProgressBar('millwrightin\' [:bar] :task finished at :endTimes', { total: 10 });

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

const timers = {};

function pipe(coll, fn, cond, when) {
  if (arguments.length === 3) {
    _.isFunction(cond) ? when = true : (when = cond, cond = _.stubTrue);
  } else if (arguments.length === 2) {
    when = true, cond = _.stubTrue;
  }

  if (!when) {
    return coll;
  }

  const fnId = Symbol();

  const wrap = (value, fn, index, length, wrapped) => {
    const id = Symbol();
    report(fnId, id, fn, length);
    const result = wrapped(value);
    isPromise(result) ? result.then(() => report(fnId, id)) : report(fnId, id);
    return result;
  };

  const pipeValues = _.curry((coll, fn, cond) => {
    return _.map(coll, (value, index, coll) => {
      const iterate = val => cond(val) ? fn(val) : val;
      if (isPromise(value)) {
        return value.then(val => wrap(val, fn, index, coll.length, iterate));
      }
      return wrap(value, fn, index, coll.length, iterate);
    });
  });

  return isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function report(fnId, id, fn, length) {
  if (!timers.startTime) {
    timers.startTime = Date.now();
  }

  if (!timers[fnId]) {
    const fnString = fn.toString();
    timers[fnId] = {
      name: fnString.slice(fnString.indexOf(' '), fnString.indexOf('(')),
      startTime: Date.now(),
      count: 0,
      length
    };
    //console.log(`${timers[fnId].name} starting...`);
  }

  timers[fnId].count++;

  if (timers[fnId].count === timers[fnId].length * 2) {
    timers[fnId].time = Date.now() - timers[fnId].startTime;
    //console.log(`${timers[fnId].name} finished at ${(Date.now() - timers.startTime)/1000}s`);
    bar.tick({task: timers[fnId].name, endTime: (Date.now() - timers.startTime) / 1000});
  }
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
