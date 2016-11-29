const _ = require('lodash');

_.mixin({
  attemptSilent,
  isPromise
});

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
