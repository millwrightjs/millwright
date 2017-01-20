'use strict';

var path = require('path');
var _ = require('lodash');
var config = require('../config');

var _require = require('../utils/util'),
    getCompiledType = _require.getCompiledType,
    getType = _require.getType,
    stripIgnoredBasePath = _require.stripIgnoredBasePath;

module.exports = normalizeDep;

function normalizeDep(ref) {
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.assetIgnoredBasePaths);
  ref.dirStripped = path.dirname(ref.srcStripped);
  ref.baseDest = ref.base;
  ref.extDest = ref.ext;
  var type = getType(ref.ext);
  ref.typeDest = type;
  var compiledType = getCompiledType(type);
  if (compiledType) {
    ref.typeDest = compiledType;
    ref.extDest = '.' + ref.typeDest;
    ref.baseDest = ref.name + ref.extDest;
  }
  ref.isMinified = ref.isMinified || path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }

  var consumerName = path.basename(ref.consumer, '.json');
  var consumerDir = path.dirname(path.relative(path.join(process.cwd(), config.srcDir), ref.consumer));
  var forWrapper = consumerName === 'wrapper';

  ref.dest = path.join(config.destDir, ref.dirStripped, ref.baseDest);

  // Fix dest for assets that are above the src directory, such as node modules
  if (!ref.dest.startsWith(consumerDir, config.destDir.length + 1)) {
    ref.dest = path.join(config.destDir, consumerDir, ref.dirStripped, ref.baseDest);
  }

  ref.dirDest = path.dirname(ref.dest);

  ref.sourcemapPath = path.join(ref.dirStripped, ref.baseDest + '.map');

  if (process.env.task === 'build') {
    ref.extDest = '.min.' + ref.typeDest;

    if (!ref.isMinified) {
      ref.baseDest = ref.name + ref.extDest;
      ref.dest = path.join(ref.dirDest, ref.base);
    }

    ref.dirDest = consumerDir;

    var pagePrefix = forWrapper ? '' : consumerName + '-';
    var webPathPrefix = (forWrapper ? '/' : '') + ref.dirDest;

    ref.dirDest = path.join(config.destDir, ref.dirDest);
    ref.filenameDest = pagePrefix + ref.groupKey + ref.extDest;
    ref.dest = path.join(ref.dirDest, ref.filenameDest);
    ref.webPath = path.join(webPathPrefix, ref.filenameDest);
    ref.sourcemapPath = ref.webPath + '.map';
  }

  return ref;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL25vcm1hbGl6ZS1kZXAuanMiXSwibmFtZXMiOlsicGF0aCIsInJlcXVpcmUiLCJfIiwiY29uZmlnIiwiZ2V0Q29tcGlsZWRUeXBlIiwiZ2V0VHlwZSIsInN0cmlwSWdub3JlZEJhc2VQYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsIm5vcm1hbGl6ZURlcCIsInJlZiIsInNyY1N0cmlwcGVkIiwic3JjIiwiYXNzZXRJZ25vcmVkQmFzZVBhdGhzIiwiZGlyU3RyaXBwZWQiLCJkaXJuYW1lIiwiYmFzZURlc3QiLCJiYXNlIiwiZXh0RGVzdCIsImV4dCIsInR5cGUiLCJ0eXBlRGVzdCIsImNvbXBpbGVkVHlwZSIsIm5hbWUiLCJpc01pbmlmaWVkIiwiZXh0bmFtZSIsImJhc2VuYW1lIiwiY29uc3VtZXJOYW1lIiwiY29uc3VtZXIiLCJjb25zdW1lckRpciIsInJlbGF0aXZlIiwiam9pbiIsInByb2Nlc3MiLCJjd2QiLCJzcmNEaXIiLCJmb3JXcmFwcGVyIiwiZGVzdCIsImRlc3REaXIiLCJzdGFydHNXaXRoIiwibGVuZ3RoIiwiZGlyRGVzdCIsInNvdXJjZW1hcFBhdGgiLCJlbnYiLCJ0YXNrIiwicGFnZVByZWZpeCIsIndlYlBhdGhQcmVmaXgiLCJmaWxlbmFtZURlc3QiLCJncm91cEtleSIsIndlYlBhdGgiXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBTUEsT0FBT0MsUUFBUSxNQUFSLENBQWI7QUFDQSxJQUFNQyxJQUFJRCxRQUFRLFFBQVIsQ0FBVjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsV0FBUixDQUFmOztlQUN5REEsUUFBUSxlQUFSLEM7SUFBbERHLGUsWUFBQUEsZTtJQUFpQkMsTyxZQUFBQSxPO0lBQVNDLG9CLFlBQUFBLG9COztBQUVqQ0MsT0FBT0MsT0FBUCxHQUFpQkMsWUFBakI7O0FBRUEsU0FBU0EsWUFBVCxDQUFzQkMsR0FBdEIsRUFBMkI7QUFDekJBLE1BQUlDLFdBQUosR0FBa0JMLHFCQUFxQkksSUFBSUUsR0FB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a0MsT0FBakIsRUFBMEIzQixJQUFJOEIsT0FBOUIsQ0FBZDtBQUNBOUIsUUFBSW9DLFlBQUosR0FBbUJGLGFBQWFsQyxJQUFJcUMsUUFBakIsR0FBNEJyQyxJQUFJUSxPQUFuRDtBQUNBUixRQUFJMEIsSUFBSixHQUFXcEMsS0FBSytCLElBQUwsQ0FBVXJCLElBQUk4QixPQUFkLEVBQXVCOUIsSUFBSW9DLFlBQTNCLENBQVg7QUFDQXBDLFFBQUlzQyxPQUFKLEdBQWNoRCxLQUFLK0IsSUFBTCxDQUFVYyxhQUFWLEVBQXlCbkMsSUFBSW9DLFlBQTdCLENBQWQ7QUFDQXBDLFFBQUkrQixhQUFKLEdBQW9CL0IsSUFBSXNDLE9BQUosR0FBYyxNQUFsQztBQUNEOztBQUVELFNBQU90QyxHQUFQO0FBQ0QiLCJmaWxlIjoibm9ybWFsaXplLWRlcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XG5jb25zdCBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcbmNvbnN0IHtnZXRDb21waWxlZFR5cGUsIGdldFR5cGUsIHN0cmlwSWdub3JlZEJhc2VQYXRofSA9IHJlcXVpcmUoJy4uL3V0aWxzL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBub3JtYWxpemVEZXA7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURlcChyZWYpIHtcbiAgcmVmLnNyY1N0cmlwcGVkID0gc3RyaXBJZ25vcmVkQmFzZVBhdGgocmVmLnNyYywgY29uZmlnLmFzc2V0SWdub3JlZEJhc2VQYXRocyk7XG4gIHJlZi5kaXJTdHJpcHBlZCA9IHBhdGguZGlybmFtZShyZWYuc3JjU3RyaXBwZWQpO1xuICByZWYuYmFzZURlc3QgPSByZWYuYmFzZTtcbiAgcmVmLmV4dERlc3QgPSByZWYuZXh0O1xuICBjb25zdCB0eXBlID0gZ2V0VHlwZShyZWYuZXh0KTtcbiAgcmVmLnR5cGVEZXN0ID0gdHlwZTtcbiAgY29uc3QgY29tcGlsZWRUeXBlID0gZ2V0Q29tcGlsZWRUeXBlKHR5cGUpO1xuICBpZiAoY29tcGlsZWRUeXBlKSB7XG4gICAgcmVmLnR5cGVEZXN0ID0gY29tcGlsZWRUeXBlO1xuICAgIHJlZi5leHREZXN0ID0gJy4nICsgcmVmLnR5cGVEZXN0O1xuICAgIHJlZi5iYXNlRGVzdCA9IHJlZi5uYW1lICsgcmVmLmV4dERlc3Q7XG4gIH1cbiAgcmVmLmlzTWluaWZpZWQgPSByZWYuaXNNaW5pZmllZCB8fCBwYXRoLmV4dG5hbWUocmVmLm5hbWUpID09PSAnLm1pbic7XG4gIGlmIChyZWYuaXNNaW5pZmllZCkge1xuICAgIHJlZi5uYW1lID0gcGF0aC5iYXNlbmFtZShyZWYubmFtZSwgJy5taW4nKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnN1bWVyTmFtZSA9IHBhdGguYmFzZW5hbWUocmVmLmNvbnN1bWVyLCAnLmpzb24nKTtcbiAgY29uc3QgY29uc3VtZXJEaXIgPSBwYXRoLmRpcm5hbWUocGF0aC5yZWxhdGl2ZShwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgY29uZmlnLnNyY0RpciksIHJlZi5jb25zdW1lcikpO1xuICBjb25zdCBmb3JXcmFwcGVyID0gY29uc3VtZXJOYW1lID09PSAnd3JhcHBlcic7XG5cbiAgcmVmLmRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLmRlc3REaXIsIHJlZi5kaXJTdHJpcHBlZCwgcmVmLmJhc2VEZXN0KTtcblxuICAvLyBGaXggZGVzdCBmb3IgYXNzZXRzIHRoYXQgYXJlIGFib3ZlIHRoZSBzcmMgZGlyZWN0b3J5LCBzdWNoIGFzIG5vZGUgbW9kdWxlc1xuICBpZiAoIXJlZi5kZXN0LnN0YXJ0c1dpdGgoY29uc3VtZXJEaXIsIGNvbmZpZy5kZXN0RGlyLmxlbmd0aCArIDEpKSB7XG4gICAgcmVmLmRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLmRlc3REaXIsIGNvbnN1bWVyRGlyLCByZWYuZGlyU3RyaXBwZWQsIHJlZi5iYXNlRGVzdCk7XG4gIH1cblxuICByZWYuZGlyRGVzdCA9IHBhdGguZGlybmFtZShyZWYuZGVzdCk7XG5cbiAgcmVmLnNvdXJjZW1hcFBhdGggPSBwYXRoLmpvaW4ocmVmLmRpclN0cmlwcGVkLCByZWYuYmFzZURlc3QgKyAnLm1hcCcpO1xuXG4gIGlmIChwcm9jZXNzLmVudi50YXNrID09PSAnYnVpbGQnKSB7XG4gICAgcmVmLmV4dERlc3QgPSAnLm1pbi4nICsgcmVmLnR5cGVEZXN0O1xuXG4gICAgaWYgKCFyZWYuaXNNaW5pZmllZCkge1xuICAgICAgcmVmLmJhc2VEZXN0ID0gcmVmLm5hbWUgKyByZWYuZXh0RGVzdDtcbiAgICAgIHJlZi5kZXN0ID0gcGF0aC5qb2luKHJlZi5kaXJEZXN0LCByZWYuYmFzZSk7XG4gICAgfVxuXG4gICAgcmVmLmRpckRlc3QgPSBjb25zdW1lckRpcjtcblxuICAgIGNvbnN0IHBhZ2VQcmVmaXggPSBmb3JXcmFwcGVyID8gJycgOiBjb25zdW1lck5hbWUgKyAnLSc7XG4gICAgY29uc3Qgd2ViUGF0aFByZWZpeCA9IChmb3JXcmFwcGVyID8gJy8nIDogJycpICsgcmVmLmRpckRlc3Q7XG5cbiAgICByZWYuZGlyRGVzdCA9IHBhdGguam9pbihjb25maWcuZGVzdERpciwgcmVmLmRpckRlc3QpO1xuICAgIHJlZi5maWxlbmFtZURlc3QgPSBwYWdlUHJlZml4ICsgcmVmLmdyb3VwS2V5ICsgcmVmLmV4dERlc3Q7XG4gICAgcmVmLmRlc3QgPSBwYXRoLmpvaW4ocmVmLmRpckRlc3QsIHJlZi5maWxlbmFtZURlc3QpO1xuICAgIHJlZi53ZWJQYXRoID0gcGF0aC5qb2luKHdlYlBhdGhQcmVmaXgsIHJlZi5maWxlbmFtZURlc3QpO1xuICAgIHJlZi5zb3VyY2VtYXBQYXRoID0gcmVmLndlYlBhdGggKyAnLm1hcCc7XG4gIH1cblxuICByZXR1cm4gcmVmO1xufVxuIl19