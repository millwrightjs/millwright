const _ = require('lodash');
const {trackPipe} = require('./track.js');

_.mixin({
  pipe,
  pipeAll,
  pipeTap,
  pipeLog
});

function pipe(coll, fn, cond, when) {
  if (arguments.length === 3) {
    _.isFunction(cond) ? when = true : (when = cond, cond = _.stubTrue);
  } else if (arguments.length === 2) {
    when = true, cond = _.stubTrue;
  }

  if (!when) {
    return coll;
  }

  const getTrackingDetails = trackPipe();

  const pipeValues = _.curry((coll, fn, cond) => {
    return _.map(coll, (value, index, coll) => {
      const track = getTrackingDetails(fn, _, val => cond(val) ? fn(val) : val, coll.length);
      return _.isPromise(value) ? value.then(track) : track(value);
    });
  });

  return _.isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function pipeAll(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    const track = trackPipe(fn, _, fn, 1);
    return _.isPromise(coll) ? coll.then(track) : Promise.all(_.castArray(coll)).then(track);
  }
  return coll;
}

function pipeTap(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    const track = trackPipe(fn, _, fn, 1);
    _.isPromise(coll) ? coll.then(track) : Promise.all(_.castArray(coll)).then(track);
  }
  return coll;
}

function pipeLog(coll) {
  const log = vals => _.map(vals, val => _.isPromise(val) ? val.then(console.log) : console.log(val));
  _.isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}
