const _ = require('lodash');
const track = require('./track.js');

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

  const fnId = Symbol();

  const pipeValues = _.curry((coll, fn, cond) => {
    return _.map(coll, (value, index, coll) => {
      const iterate = val => cond(val) ? fn(val) : val;
      if (_.isPromise(value)) {
        return value.then(val => track(val, fn, fnId, index, coll.length, iterate));
      }
      return track(value, fn, fnId, index, coll.length, iterate);
    });
  });

  return _.isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function pipeAll(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    return _.isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeTap(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    _.isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeLog(coll) {
  const log = vals => _.map(vals, val => _.isPromise(val) ? val.then(console.log) : console.log(val));
  _.isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}
