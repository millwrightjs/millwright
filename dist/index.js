'use strict';

// TODO: remove uncaught exception logging
// This is in place temporarily to ensure we at least get a stack trace on failure while the project
// is in alpha.
process.on('uncaughtException', function (e) {
  console.log(e);process.exit(1);
});
process.on('unhandledRejection', function (e) {
  console.log(e);process.exit(1);
});

require('./utils/lodash-utils');
require('./utils/lodash-flow');
var _ = require('lodash');
var argv = require('yargs').argv;
var requireDir = require('require-dir');
var tasks = requireDir('./tasks', { camelcase: true });
var config = require('./config');

var realCmd = Object.keys(tasks).indexOf(argv._[0]) >= 0;
var cmd = realCmd ? argv._[0] : config.defaultCommand;

module.exports = tasks[cmd];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJwcm9jZXNzIiwib24iLCJjb25zb2xlIiwibG9nIiwiZSIsImV4aXQiLCJyZXF1aXJlIiwiXyIsImFyZ3YiLCJyZXF1aXJlRGlyIiwidGFza3MiLCJjYW1lbGNhc2UiLCJjb25maWciLCJyZWFsQ21kIiwiT2JqZWN0Iiwia2V5cyIsImluZGV4T2YiLCJjbWQiLCJkZWZhdWx0Q29tbWFuZCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0FBLFFBQVFDLEVBQVIsQ0FBVyxtQkFBWCxFQUFnQyxhQUFLO0FBQUNDLFVBQVFDLEdBQVIsQ0FBWUMsQ0FBWixFQUFnQkosUUFBUUssSUFBUixDQUFhLENBQWI7QUFBaUIsQ0FBdkU7QUFDQUwsUUFBUUMsRUFBUixDQUFXLG9CQUFYLEVBQWlDLGFBQUs7QUFBQ0MsVUFBUUMsR0FBUixDQUFZQyxDQUFaLEVBQWdCSixRQUFRSyxJQUFSLENBQWEsQ0FBYjtBQUFpQixDQUF4RTs7QUFFQUMsUUFBUSxzQkFBUjtBQUNBQSxRQUFRLHFCQUFSO0FBQ0EsSUFBTUMsSUFBSUQsUUFBUSxRQUFSLENBQVY7QUFDQSxJQUFNRSxPQUFPRixRQUFRLE9BQVIsRUFBaUJFLElBQTlCO0FBQ0EsSUFBTUMsYUFBYUgsUUFBUSxhQUFSLENBQW5CO0FBQ0EsSUFBTUksUUFBUUQsV0FBVyxTQUFYLEVBQXNCLEVBQUNFLFdBQVcsSUFBWixFQUF0QixDQUFkO0FBQ0EsSUFBTUMsU0FBU04sUUFBUSxVQUFSLENBQWY7O0FBRUEsSUFBTU8sVUFBVUMsT0FBT0MsSUFBUCxDQUFZTCxLQUFaLEVBQW1CTSxPQUFuQixDQUEyQlIsS0FBS0QsQ0FBTCxDQUFPLENBQVAsQ0FBM0IsS0FBeUMsQ0FBekQ7QUFDQSxJQUFNVSxNQUFNSixVQUFVTCxLQUFLRCxDQUFMLENBQU8sQ0FBUCxDQUFWLEdBQXNCSyxPQUFPTSxjQUF6Qzs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQlYsTUFBTU8sR0FBTixDQUFqQiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE86IHJlbW92ZSB1bmNhdWdodCBleGNlcHRpb24gbG9nZ2luZ1xuLy8gVGhpcyBpcyBpbiBwbGFjZSB0ZW1wb3JhcmlseSB0byBlbnN1cmUgd2UgYXQgbGVhc3QgZ2V0IGEgc3RhY2sgdHJhY2Ugb24gZmFpbHVyZSB3aGlsZSB0aGUgcHJvamVjdFxuLy8gaXMgaW4gYWxwaGEuXG5wcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIGUgPT4ge2NvbnNvbGUubG9nKGUpOyBwcm9jZXNzLmV4aXQoMSk7fSk7XG5wcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCBlID0+IHtjb25zb2xlLmxvZyhlKTsgcHJvY2Vzcy5leGl0KDEpO30pO1xuXG5yZXF1aXJlKCcuL3V0aWxzL2xvZGFzaC11dGlscycpO1xucmVxdWlyZSgnLi91dGlscy9sb2Rhc2gtZmxvdycpO1xuY29uc3QgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuY29uc3QgYXJndiA9IHJlcXVpcmUoJ3lhcmdzJykuYXJndjtcbmNvbnN0IHJlcXVpcmVEaXIgPSByZXF1aXJlKCdyZXF1aXJlLWRpcicpO1xuY29uc3QgdGFza3MgPSByZXF1aXJlRGlyKCcuL3Rhc2tzJywge2NhbWVsY2FzZTogdHJ1ZX0pO1xuY29uc3QgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblxuY29uc3QgcmVhbENtZCA9IE9iamVjdC5rZXlzKHRhc2tzKS5pbmRleE9mKGFyZ3YuX1swXSkgPj0gMDtcbmNvbnN0IGNtZCA9IHJlYWxDbWQgPyBhcmd2Ll9bMF0gOiBjb25maWcuZGVmYXVsdENvbW1hbmQ7XG5cbm1vZHVsZS5leHBvcnRzID0gdGFza3NbY21kXTtcbiJdfQ==