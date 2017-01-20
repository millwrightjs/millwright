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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9sb2Rhc2gtdXRpbHMuanMiXSwibmFtZXMiOlsiXyIsInJlcXVpcmUiLCJtaXhpbiIsImF0dGVtcHRTaWxlbnQiLCJpc1Byb21pc2UiLCJmbiIsImFyZ3MiLCJyZXN1bHQiLCJhdHRlbXB0IiwiY2F0Y2giLCJub29wIiwiRXJyb3IiLCJ2YWx1ZSIsImdldCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNQSxJQUFJQyxRQUFRLFFBQVIsQ0FBVjs7QUFFQUQsRUFBRUUsS0FBRixDQUFRO0FBQ05DLDhCQURNO0FBRU5DO0FBRk0sQ0FBUjs7QUFLQSxTQUFTRCxhQUFULENBQXVCRSxFQUF2QixFQUFvQztBQUFBLG9DQUFOQyxJQUFNO0FBQU5BLFFBQU07QUFBQTs7QUFDbEMsTUFBTUMsU0FBU1AsRUFBRVEsT0FBRixXQUFVSCxFQUFWLFNBQWlCQyxJQUFqQixFQUFmO0FBQ0EsTUFBSUYsVUFBVUcsTUFBVixDQUFKLEVBQXVCO0FBQ3JCLFdBQU9BLE9BQU9FLEtBQVAsQ0FBYVQsRUFBRVUsSUFBZixDQUFQO0FBQ0QsR0FGRCxNQUlLLElBQUksRUFBRUgsa0JBQWtCSSxLQUFwQixDQUFKLEVBQWdDO0FBQ25DLFdBQU9KLE1BQVA7QUFDRDtBQUNGOztBQUVELFNBQVNILFNBQVQsQ0FBbUJRLEtBQW5CLEVBQTBCO0FBQ3hCLFNBQU8sQ0FBQyxDQUFDWixFQUFFYSxHQUFGLENBQU1ELEtBQU4sRUFBYSxNQUFiLENBQVQ7QUFDRCIsImZpbGUiOiJsb2Rhc2gtdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5cbl8ubWl4aW4oe1xuICBhdHRlbXB0U2lsZW50LFxuICBpc1Byb21pc2Vcbn0pO1xuXG5mdW5jdGlvbiBhdHRlbXB0U2lsZW50KGZuLCAuLi5hcmdzKSB7XG4gIGNvbnN0IHJlc3VsdCA9IF8uYXR0ZW1wdChmbiwgLi4uYXJncyk7XG4gIGlmIChpc1Byb21pc2UocmVzdWx0KSkge1xuICAgIHJldHVybiByZXN1bHQuY2F0Y2goXy5ub29wKTtcbiAgfVxuXG4gIGVsc2UgaWYgKCEocmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1Byb21pc2UodmFsdWUpIHtcbiAgcmV0dXJuICEhXy5nZXQodmFsdWUsICd0aGVuJyk7XG59XG4iXX0=