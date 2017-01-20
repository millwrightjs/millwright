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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9sb2Rhc2gtZmxvdy5qcyJdLCJuYW1lcyI6WyJfIiwicmVxdWlyZSIsIm1peGluIiwiZmxvdyIsImZsb3dBbGwiLCJmbG93VGFwIiwiZmxvd0xvZyIsImNvbGwiLCJmbiIsImNvbmQiLCJ3aGVuIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiaXNGdW5jdGlvbiIsInN0dWJUcnVlIiwiZmxvd1ZhbHVlcyIsImN1cnJ5IiwibWFwIiwidmFsdWUiLCJpbmRleCIsInJ1bkNvbmRpdGlvbmFsbHkiLCJ2YWwiLCJpc1Byb21pc2UiLCJ0aGVuIiwiUHJvbWlzZSIsImFsbCIsImNhc3RBcnJheSIsImxvZyIsInZhbHMiLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLElBQUlDLFFBQVEsUUFBUixDQUFWOztBQUVBRCxFQUFFRSxLQUFGLENBQVE7QUFDTkMsWUFETTtBQUVOQyxrQkFGTTtBQUdOQyxrQkFITTtBQUlOQztBQUpNLENBQVI7O0FBT0EsU0FBU0gsSUFBVCxDQUFjSSxJQUFkLEVBQW9CQyxFQUFwQixFQUF3QkMsSUFBeEIsRUFBOEJDLElBQTlCLEVBQW9DO0FBQ2xDLE1BQUlDLFVBQVVDLE1BQVYsS0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJaLE1BQUVhLFVBQUYsQ0FBYUosSUFBYixJQUFxQkMsT0FBTyxJQUE1QixJQUFvQ0EsT0FBT0QsSUFBUCxFQUFhQSxPQUFPVCxFQUFFYyxRQUExRDtBQUNELEdBRkQsTUFFTyxJQUFJSCxVQUFVQyxNQUFWLEtBQXFCLENBQXpCLEVBQTRCO0FBQ2pDRixXQUFPLElBQVAsRUFBYUQsT0FBT1QsRUFBRWMsUUFBdEI7QUFDRDs7QUFFRCxNQUFJLENBQUNKLElBQUwsRUFBVztBQUNULFdBQU9ILElBQVA7QUFDRDs7QUFFRCxNQUFNUSxhQUFhZixFQUFFZ0IsS0FBRixDQUFRLFVBQUNULElBQUQsRUFBT0MsRUFBUCxFQUFXQyxJQUFYLEVBQW9CO0FBQzdDLFdBQU9ULEVBQUVpQixHQUFGLENBQU1WLElBQU4sRUFBWSxVQUFDVyxLQUFELEVBQVFDLEtBQVIsRUFBZVosSUFBZixFQUF3QjtBQUN6QyxVQUFNYSxtQkFBbUIsU0FBbkJBLGdCQUFtQjtBQUFBLGVBQU9YLEtBQUtZLEdBQUwsSUFBWWIsR0FBR2EsR0FBSCxDQUFaLEdBQXNCQSxHQUE3QjtBQUFBLE9BQXpCO0FBQ0EsYUFBT3JCLEVBQUVzQixTQUFGLENBQVlKLEtBQVosSUFBcUJBLE1BQU1LLElBQU4sQ0FBV0gsZ0JBQVgsQ0FBckIsR0FBb0RBLGlCQUFpQkYsS0FBakIsQ0FBM0Q7QUFDRCxLQUhNLENBQVA7QUFJRCxHQUxrQixDQUFuQjs7QUFPQSxTQUFPbEIsRUFBRXNCLFNBQUYsQ0FBWWYsSUFBWixJQUFvQkEsS0FBS2dCLElBQUwsQ0FBVVIsV0FBV2YsQ0FBWCxFQUFjUSxFQUFkLEVBQWtCQyxJQUFsQixDQUFWLENBQXBCLEdBQXlETSxXQUFXUixJQUFYLEVBQWlCQyxFQUFqQixFQUFxQkMsSUFBckIsQ0FBaEU7QUFDRDs7QUFFRCxTQUFTTCxPQUFULENBQWlCRyxJQUFqQixFQUF1QkMsRUFBdkIsRUFBMkJFLElBQTNCLEVBQWlDO0FBQy9CQSxTQUFPQyxVQUFVQyxNQUFWLEtBQXFCLENBQXJCLEdBQXlCRixJQUF6QixHQUFnQyxJQUF2QztBQUNBLE1BQUlBLElBQUosRUFBVTtBQUNSLFdBQU9WLEVBQUVzQixTQUFGLENBQVlmLElBQVosSUFBb0JBLEtBQUtnQixJQUFMLENBQVVmLEVBQVYsQ0FBcEIsR0FBb0NnQixRQUFRQyxHQUFSLENBQVl6QixFQUFFMEIsU0FBRixDQUFZbkIsSUFBWixDQUFaLEVBQStCZ0IsSUFBL0IsQ0FBb0NmLEVBQXBDLENBQTNDO0FBQ0Q7QUFDRCxTQUFPRCxJQUFQO0FBQ0Q7O0FBRUQsU0FBU0YsT0FBVCxDQUFpQkUsSUFBakIsRUFBdUJDLEVBQXZCLEVBQTJCRSxJQUEzQixFQUFpQztBQUMvQk4sVUFBUUcsSUFBUixFQUFjQyxFQUFkLEVBQWtCRSxJQUFsQjtBQUNBLFNBQU9ILElBQVA7QUFDRDs7QUFFRCxTQUFTRCxPQUFULENBQWlCQyxJQUFqQixFQUF1QjtBQUNyQixNQUFNb0IsTUFBTSxTQUFOQSxHQUFNO0FBQUEsV0FBUTNCLEVBQUVpQixHQUFGLENBQU1XLElBQU4sRUFBWTtBQUFBLGFBQU81QixFQUFFc0IsU0FBRixDQUFZRCxHQUFaLElBQW1CQSxJQUFJRSxJQUFKLENBQVNNLFFBQVFGLEdBQWpCLENBQW5CLEdBQTJDRSxRQUFRRixHQUFSLENBQVlOLEdBQVosQ0FBbEQ7QUFBQSxLQUFaLENBQVI7QUFBQSxHQUFaO0FBQ0FyQixJQUFFc0IsU0FBRixDQUFZZixJQUFaLElBQW9CQSxLQUFLZ0IsSUFBTCxDQUFVSSxHQUFWLENBQXBCLEdBQXFDQSxJQUFJcEIsSUFBSixDQUFyQztBQUNBLFNBQU9BLElBQVA7QUFDRCIsImZpbGUiOiJsb2Rhc2gtZmxvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcblxuXy5taXhpbih7XG4gIGZsb3csXG4gIGZsb3dBbGwsXG4gIGZsb3dUYXAsXG4gIGZsb3dMb2dcbn0pO1xuXG5mdW5jdGlvbiBmbG93KGNvbGwsIGZuLCBjb25kLCB3aGVuKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgXy5pc0Z1bmN0aW9uKGNvbmQpID8gd2hlbiA9IHRydWUgOiAod2hlbiA9IGNvbmQsIGNvbmQgPSBfLnN0dWJUcnVlKTtcbiAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgd2hlbiA9IHRydWUsIGNvbmQgPSBfLnN0dWJUcnVlO1xuICB9XG5cbiAgaWYgKCF3aGVuKSB7XG4gICAgcmV0dXJuIGNvbGw7XG4gIH1cblxuICBjb25zdCBmbG93VmFsdWVzID0gXy5jdXJyeSgoY29sbCwgZm4sIGNvbmQpID0+IHtcbiAgICByZXR1cm4gXy5tYXAoY29sbCwgKHZhbHVlLCBpbmRleCwgY29sbCkgPT4ge1xuICAgICAgY29uc3QgcnVuQ29uZGl0aW9uYWxseSA9IHZhbCA9PiBjb25kKHZhbCkgPyBmbih2YWwpIDogdmFsO1xuICAgICAgcmV0dXJuIF8uaXNQcm9taXNlKHZhbHVlKSA/IHZhbHVlLnRoZW4ocnVuQ29uZGl0aW9uYWxseSkgOiBydW5Db25kaXRpb25hbGx5KHZhbHVlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIF8uaXNQcm9taXNlKGNvbGwpID8gY29sbC50aGVuKGZsb3dWYWx1ZXMoXywgZm4sIGNvbmQpKSA6IGZsb3dWYWx1ZXMoY29sbCwgZm4sIGNvbmQpO1xufVxuXG5mdW5jdGlvbiBmbG93QWxsKGNvbGwsIGZuLCB3aGVuKSB7XG4gIHdoZW4gPSBhcmd1bWVudHMubGVuZ3RoID09PSAzID8gd2hlbiA6IHRydWU7XG4gIGlmICh3aGVuKSB7XG4gICAgcmV0dXJuIF8uaXNQcm9taXNlKGNvbGwpID8gY29sbC50aGVuKGZuKSA6IFByb21pc2UuYWxsKF8uY2FzdEFycmF5KGNvbGwpKS50aGVuKGZuKTtcbiAgfVxuICByZXR1cm4gY29sbDtcbn1cblxuZnVuY3Rpb24gZmxvd1RhcChjb2xsLCBmbiwgd2hlbikge1xuICBmbG93QWxsKGNvbGwsIGZuLCB3aGVuKTtcbiAgcmV0dXJuIGNvbGw7XG59XG5cbmZ1bmN0aW9uIGZsb3dMb2coY29sbCkge1xuICBjb25zdCBsb2cgPSB2YWxzID0+IF8ubWFwKHZhbHMsIHZhbCA9PiBfLmlzUHJvbWlzZSh2YWwpID8gdmFsLnRoZW4oY29uc29sZS5sb2cpIDogY29uc29sZS5sb2codmFsKSk7XG4gIF8uaXNQcm9taXNlKGNvbGwpID8gY29sbC50aGVuKGxvZykgOiBsb2coY29sbCk7XG4gIHJldHVybiBjb2xsO1xufVxuIl19