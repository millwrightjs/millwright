const _ = require('lodash');
const timer = {};

module.exports = {trackPipe};

function trackPipe(...args) {
  return _.curry(track)(Symbol(), ...args);
}

function track(fnId, fn, value, trackedFn, length) {
  const id = Symbol();
  report(fnId, id, fn, length);
  const result = trackedFn(value);
  _.isPromise(result) ? result.then(() => report(fnId, id)) : report(fnId, id);
  return result;
}

function report(fnId, id, fn, length) {
  if (process.env.watch) {
    return;
  }

  if (!timer.startTime) {
    timer.startTime = Date.now();
    console.log(`millin' ${length} files, hang tight...`);
  }

  if (!timer[fnId]) {
    const fnString = fn.toString();
    timer[fnId] = {
      name: fnString.slice(fnString.indexOf(' ') + 1, fnString.indexOf('(')),
      startTime: Date.now(),
      count: 0,
      length
    };
  }

  timer[fnId].count++;

  if (timer[fnId].count === timer[fnId].length * 2) {
    timer[fnId].time = Date.now() - timer[fnId].startTime;
    console.log(`${timer[fnId].name} finished at ${((Date.now() - timer.startTime)/1000).toFixed(3)}s`);
  }
}
