'use strict';

var path = require('path');
var _ = require('lodash');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs-extra'));

module.exports = function read(file) {
  return fs.readFileAsync(file.src).then(function (result) {
    return _.assign(file, { content: result.toString() });
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL3JlYWQuanMiXSwibmFtZXMiOlsicGF0aCIsInJlcXVpcmUiLCJfIiwiYmx1ZWJpcmQiLCJmcyIsInByb21pc2lmeUFsbCIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZWFkIiwiZmlsZSIsInJlYWRGaWxlQXN5bmMiLCJzcmMiLCJ0aGVuIiwiYXNzaWduIiwiY29udGVudCIsInJlc3VsdCIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLE9BQU9DLFFBQVEsTUFBUixDQUFiO0FBQ0EsSUFBTUMsSUFBSUQsUUFBUSxRQUFSLENBQVY7QUFDQSxJQUFNRSxXQUFXRixRQUFRLFVBQVIsQ0FBakI7QUFDQSxJQUFNRyxLQUFLRCxTQUFTRSxZQUFULENBQXNCSixRQUFRLFVBQVIsQ0FBdEIsQ0FBWDs7QUFFQUssT0FBT0MsT0FBUCxHQUFpQixTQUFTQyxJQUFULENBQWNDLElBQWQsRUFBb0I7QUFDbkMsU0FBT0wsR0FBR00sYUFBSCxDQUFpQkQsS0FBS0UsR0FBdEIsRUFBMkJDLElBQTNCLENBQWdDLGtCQUFVO0FBQy9DLFdBQU9WLEVBQUVXLE1BQUYsQ0FBU0osSUFBVCxFQUFlLEVBQUNLLFNBQVNDLE9BQU9DLFFBQVAsRUFBVixFQUFmLENBQVA7QUFDRCxHQUZNLENBQVA7QUFHRCxDQUpEIiwiZmlsZSI6InJlYWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgYmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuY29uc3QgZnMgPSBibHVlYmlyZC5wcm9taXNpZnlBbGwocmVxdWlyZSgnZnMtZXh0cmEnKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVhZChmaWxlKSB7XG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGUuc3JjKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgcmV0dXJuIF8uYXNzaWduKGZpbGUsIHtjb250ZW50OiByZXN1bHQudG9TdHJpbmcoKX0pO1xuICB9KTtcbn07XG4iXX0=