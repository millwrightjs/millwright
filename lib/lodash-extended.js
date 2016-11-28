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
    // Send minimal data set to external reporting function, that's it.
    // Probably just the function and maybe the entire collection for evaluation.
    // Entire collection may be better than trying to figure out reporting stuff
    // here in this function.
    report(fn);
    return _.map(coll, value => {
      if (isPromise(value)) {
        return value.then(val => cond(val) ? fn(val) : val);
      }
      return cond(value) ? fn(value) : value;
    });
  });

  return isPromise(coll) ? coll.then(pipeValues(_, fn, cond)) : pipeValues(coll, fn, cond);
}

function report(fn) {
  // We want to print the function name with ellipsis the first time a given plugin starts running.
  // We want to collect and add the time it takes for a given plugin to run each time it runs.
  // When we are certain that the last item has run through the plugin, print the total time spent
  // running the function in place of the ellipsis.
  const fnString = fn.toString();
  const fnNameStart = fnString.indexOf(' ');
  const fnNameEnd = fnString.indexOf('(');
  const fnName = fnString.slice(fnNameStart, fnNameEnd);
  console.log(fnName);
}

function pipeAll(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    report(fn);
    return isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeTap(coll, fn, _when) {
  const when = arguments.length === 3 ? _when : true;
  if (when) {
    report(fn);
    isPromise(coll) ? coll.then(fn) : Promise.all(_.castArray(coll)).then(fn);
  }
  return coll;
}

function pipeLog(coll) {
  const log = vals => _.map(vals, val => isPromise(val) ? val.then(console.log) : console.log(val));
  isPromise(coll) ? coll.then(log) : log(coll);
  return coll;
}
