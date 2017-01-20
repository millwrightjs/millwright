'use strict';

var path = require('path');
var _ = require('lodash');
var pathExists = require('path-exists').sync;
var cache = require('../utils/cache');

module.exports = cacheImport;

function cacheImport(files) {
  _.forEach(files, function (file) {
    _.forEach(file.mapImports, function (source) {
      var resolved = path.resolve(source);
      if (pathExists(resolved)) {
        cache.push('deps', {
          src: source,
          srcResolved: resolved,
          consumer: file.srcResolved
        });
        var cached = cache.get('files', resolved);
        cached.role = cached.role || 'import';
      }
    });
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL2NhY2hlLWltcG9ydC5qcyJdLCJuYW1lcyI6WyJwYXRoIiwicmVxdWlyZSIsIl8iLCJwYXRoRXhpc3RzIiwic3luYyIsImNhY2hlIiwibW9kdWxlIiwiZXhwb3J0cyIsImNhY2hlSW1wb3J0IiwiZmlsZXMiLCJmb3JFYWNoIiwiZmlsZSIsIm1hcEltcG9ydHMiLCJyZXNvbHZlZCIsInJlc29sdmUiLCJzb3VyY2UiLCJwdXNoIiwic3JjIiwic3JjUmVzb2x2ZWQiLCJjb25zdW1lciIsImNhY2hlZCIsImdldCIsInJvbGUiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBTUEsT0FBT0MsUUFBUSxNQUFSLENBQWI7QUFDQSxJQUFNQyxJQUFJRCxRQUFRLFFBQVIsQ0FBVjtBQUNBLElBQU1FLGFBQWFGLFFBQVEsYUFBUixFQUF1QkcsSUFBMUM7QUFDQSxJQUFNQyxRQUFRSixRQUFRLGdCQUFSLENBQWQ7O0FBRUFLLE9BQU9DLE9BQVAsR0FBaUJDLFdBQWpCOztBQUVBLFNBQVNBLFdBQVQsQ0FBcUJDLEtBQXJCLEVBQTRCO0FBQzFCUCxJQUFFUSxPQUFGLENBQVVELEtBQVYsRUFBaUIsZ0JBQVE7QUFDdkJQLE1BQUVRLE9BQUYsQ0FBVUMsS0FBS0MsVUFBZixFQUEyQixrQkFBVTtBQUNuQyxVQUFNQyxXQUFXYixLQUFLYyxPQUFMLENBQWFDLE1BQWIsQ0FBakI7QUFDQSxVQUFJWixXQUFXVSxRQUFYLENBQUosRUFBMEI7QUFDeEJSLGNBQU1XLElBQU4sQ0FBVyxNQUFYLEVBQW1CO0FBQ2pCQyxlQUFLRixNQURZO0FBRWpCRyx1QkFBYUwsUUFGSTtBQUdqQk0sb0JBQVVSLEtBQUtPO0FBSEUsU0FBbkI7QUFLQSxZQUFNRSxTQUFTZixNQUFNZ0IsR0FBTixDQUFVLE9BQVYsRUFBbUJSLFFBQW5CLENBQWY7QUFDQU8sZUFBT0UsSUFBUCxHQUFjRixPQUFPRSxJQUFQLElBQWUsUUFBN0I7QUFDRDtBQUNGLEtBWEQ7QUFZRCxHQWJEO0FBY0QiLCJmaWxlIjoiY2FjaGUtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IHBhdGhFeGlzdHMgPSByZXF1aXJlKCdwYXRoLWV4aXN0cycpLnN5bmM7XG5jb25zdCBjYWNoZSA9IHJlcXVpcmUoJy4uL3V0aWxzL2NhY2hlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2FjaGVJbXBvcnQ7XG5cbmZ1bmN0aW9uIGNhY2hlSW1wb3J0KGZpbGVzKSB7XG4gIF8uZm9yRWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgXy5mb3JFYWNoKGZpbGUubWFwSW1wb3J0cywgc291cmNlID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVkID0gcGF0aC5yZXNvbHZlKHNvdXJjZSk7XG4gICAgICBpZiAocGF0aEV4aXN0cyhyZXNvbHZlZCkpIHtcbiAgICAgICAgY2FjaGUucHVzaCgnZGVwcycsIHtcbiAgICAgICAgICBzcmM6IHNvdXJjZSxcbiAgICAgICAgICBzcmNSZXNvbHZlZDogcmVzb2x2ZWQsXG4gICAgICAgICAgY29uc3VtZXI6IGZpbGUuc3JjUmVzb2x2ZWRcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNhY2hlZCA9IGNhY2hlLmdldCgnZmlsZXMnLCByZXNvbHZlZCk7XG4gICAgICAgIGNhY2hlZC5yb2xlID0gY2FjaGVkLnJvbGUgfHwgJ2ltcG9ydCc7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuIl19