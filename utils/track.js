const _ = require('lodash');
const timers = {};

module.exports = track;

function track(value, fn, fnId, index, length, wrapped) {
  const id = Symbol();
  report(fnId, id, fn, length);
  const result = wrapped(value);
  _.isPromise(result) ? result.then(() => report(fnId, id)) : report(fnId, id);
  return result;
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
  }

  timers[fnId].count++;

  if (timers[fnId].count === timers[fnId].length * 2) {
    timers[fnId].time = Date.now() - timers[fnId].startTime;
    console.log(`${timers[fnId].name} finished at ${((Date.now() - timers.startTime)/1000).toFixed(1)}s`);
  }
}
