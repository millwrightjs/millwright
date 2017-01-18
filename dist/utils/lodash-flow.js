'use strict';

var _ = require('lodash');

_.mixin({
  flow: flow,
  flowAll: flowAll,
  flowTap: flowTap,
  flowLog: flowLog
});

function flow(coll, fn, cond, when) {
  if (arguments.length === 3) {
    _.isFunction(cond) ? when = true : (when = cond, cond = _.stubTrue);
  } else if (arguments.length === 2) {
    when = true, cond = _.stubTrue;
  }

  if (!when) {
    return coll;
  }

  var flowValues = _.curry(function (coll, fn, cond) {
    return _.map(coll, function (value, index, coll) {
      var runConditionally = function runConditionally(val) {
        return cond(val) ? fn(val) : val;
      };
      return _.isPromise(value) ? value.then(runConditionally) : runConditionally(value);
    });
  });

  return _.isPromise(coll) ? coll.then(flowValues(_, fn, cond)) : flowValues(coll, fn, cond);
}

function flowAll(coll, fn, when) {
  when = arguments.length === 3 ? when : true;
  if (when) {
    return _.isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function flowTap(coll, fn, when) {
  flowAll(coll, fn, when);
  return coll;
}

function flowLog(coll) {
  var log = function log(vals) {
    return _.map(vals, function (val) {
      return _.isPromise(val) ? val.then(console.log) : console.log(val);
    });
  };
  _.isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}