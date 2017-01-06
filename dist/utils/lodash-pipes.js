'use strict';

var _ = require('lodash');

_.mixin({
  pipe: pipe,
  pipeAll: pipeAll,
  pipeTap: pipeTap,
  pipeLog: pipeLog
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

  var pipeValues = _.curry(function (coll, fn, cond) {
    return _.map(coll, function (value, index, coll) {
      var runConditionally = function runConditionally(val) {
        return cond(val) ? fn(val) : val;
      };
      return _.isPromise(value) ? value.then(runConditionally) : runConditionally(value);
    });
  });

  return _.isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function pipeAll(coll, fn, when) {
  when = arguments.length === 3 ? when : true;
  if (when) {
    return _.isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeTap(coll, fn, when) {
  pipeAll(coll, fn, when);
  return coll;
}

function pipeLog(coll) {
  var log = function log(vals) {
    return _.map(vals, function (val) {
      return _.isPromise(val) ? val.then(console.log) : console.log(val);
    });
  };
  _.isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}