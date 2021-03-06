'use strict';

var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');
var cache = {};

module.exports = { get: get, set: set, push: push, clear: clear };

function get(key, valueKey) {
  return valueKey ? cache[key][valueKey] : cache[key];
}

function set(key, valueKey, values) {
  cache[key] = cache[key] || {};
  _.forEach(_.castArray(values), function (val) {
    return cache[key][val[valueKey]] = val;
  });
}

function push(key, values) {
  cache[key] = (cache[key] || []).concat(_.castArray(values));
}

function clear() {
  cache = {};
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jYWNoZS5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsImZzIiwiXyIsImNhY2hlIiwibW9kdWxlIiwiZXhwb3J0cyIsImdldCIsInNldCIsInB1c2giLCJjbGVhciIsImtleSIsInZhbHVlS2V5IiwidmFsdWVzIiwiZm9yRWFjaCIsImNhc3RBcnJheSIsInZhbCIsImNvbmNhdCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNQSxPQUFPQyxRQUFRLE1BQVIsQ0FBYjtBQUNBLElBQU1DLEtBQUtELFFBQVEsVUFBUixDQUFYO0FBQ0EsSUFBTUUsSUFBSUYsUUFBUSxRQUFSLENBQVY7QUFDQSxJQUFJRyxRQUFRLEVBQVo7O0FBRUFDLE9BQU9DLE9BQVAsR0FBaUIsRUFBQ0MsUUFBRCxFQUFNQyxRQUFOLEVBQVdDLFVBQVgsRUFBaUJDLFlBQWpCLEVBQWpCOztBQUVBLFNBQVNILEdBQVQsQ0FBYUksR0FBYixFQUFrQkMsUUFBbEIsRUFBNEI7QUFDMUIsU0FBT0EsV0FBV1IsTUFBTU8sR0FBTixFQUFXQyxRQUFYLENBQVgsR0FBa0NSLE1BQU1PLEdBQU4sQ0FBekM7QUFDRDs7QUFFRCxTQUFTSCxHQUFULENBQWFHLEdBQWIsRUFBa0JDLFFBQWxCLEVBQTRCQyxNQUE1QixFQUFvQztBQUNsQ1QsUUFBTU8sR0FBTixJQUFhUCxNQUFNTyxHQUFOLEtBQWMsRUFBM0I7QUFDQVIsSUFBRVcsT0FBRixDQUFVWCxFQUFFWSxTQUFGLENBQVlGLE1BQVosQ0FBVixFQUErQjtBQUFBLFdBQU9ULE1BQU1PLEdBQU4sRUFBV0ssSUFBSUosUUFBSixDQUFYLElBQTRCSSxHQUFuQztBQUFBLEdBQS9CO0FBQ0Q7O0FBRUQsU0FBU1AsSUFBVCxDQUFjRSxHQUFkLEVBQW1CRSxNQUFuQixFQUEyQjtBQUN6QlQsUUFBTU8sR0FBTixJQUFhLENBQUNQLE1BQU1PLEdBQU4sS0FBYyxFQUFmLEVBQW1CTSxNQUFuQixDQUEwQmQsRUFBRVksU0FBRixDQUFZRixNQUFaLENBQTFCLENBQWI7QUFDRDs7QUFFRCxTQUFTSCxLQUFULEdBQWlCO0FBQ2ZOLFVBQVEsRUFBUjtBQUNEIiwiZmlsZSI6ImNhY2hlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmxldCBjYWNoZSA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtnZXQsIHNldCwgcHVzaCwgY2xlYXJ9O1xuXG5mdW5jdGlvbiBnZXQoa2V5LCB2YWx1ZUtleSkge1xuICByZXR1cm4gdmFsdWVLZXkgPyBjYWNoZVtrZXldW3ZhbHVlS2V5XSA6IGNhY2hlW2tleV07XG59XG5cbmZ1bmN0aW9uIHNldChrZXksIHZhbHVlS2V5LCB2YWx1ZXMpIHtcbiAgY2FjaGVba2V5XSA9IGNhY2hlW2tleV0gfHwge307XG4gIF8uZm9yRWFjaChfLmNhc3RBcnJheSh2YWx1ZXMpLCB2YWwgPT4gY2FjaGVba2V5XVt2YWxbdmFsdWVLZXldXSA9IHZhbCk7XG59XG5cbmZ1bmN0aW9uIHB1c2goa2V5LCB2YWx1ZXMpIHtcbiAgY2FjaGVba2V5XSA9IChjYWNoZVtrZXldIHx8IFtdKS5jb25jYXQoXy5jYXN0QXJyYXkodmFsdWVzKSk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyKCkge1xuICBjYWNoZSA9IHt9O1xufVxuIl19