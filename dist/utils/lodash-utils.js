'use strict';

var _ = require('lodash');

_.mixin({
  attemptSilent: attemptSilent,
  isPromise: isPromise
});

function attemptSilent(fn) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var result = _.attempt.apply(_, [fn].concat(args));
  if (isPromise(result)) {
    return result.catch(_.noop);
  } else if (!(result instanceof Error)) {
    return result;
  }
}

function isPromise(value) {
  return !!_.get(value, 'then');
}