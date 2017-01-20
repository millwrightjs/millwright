'use strict';

var path = require('path');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs-extra'));
var _ = require('lodash');
var config = require('../config');

module.exports = function outputSourcemaps(file) {
  // Get paths
  var mapPath = path.join(config.destDir, 'sourcemaps', file.sourcemapPath);

  // Append sourceMappingURL to file
  var mapUrl = '/' + path.relative(file.dirDest, mapPath);
  var mapUrlStringBase = '# sourceMappingURL=' + mapUrl;
  var mapUrlString = file.typeDest === 'css' ? '/*' + mapUrlStringBase + ' */' : '//' + mapUrlStringBase;
  file.content += _.endsWith(file.content, '\n') ? mapUrlString : '\n' + mapUrlString;

  // Rebuild sourcemap for consistency, remap sources, then output
  var parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  var rebuiltMap = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  var outputMap = fs.outputFileAsync(mapPath, rebuiltMap);

  return outputMap.then(function () {
    return file;
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL291dHB1dC1zb3VyY2VtYXBzLmpzIl0sIm5hbWVzIjpbInBhdGgiLCJyZXF1aXJlIiwiYmx1ZWJpcmQiLCJmcyIsInByb21pc2lmeUFsbCIsIl8iLCJjb25maWciLCJtb2R1bGUiLCJleHBvcnRzIiwib3V0cHV0U291cmNlbWFwcyIsImZpbGUiLCJtYXBQYXRoIiwiam9pbiIsImRlc3REaXIiLCJzb3VyY2VtYXBQYXRoIiwibWFwVXJsIiwicmVsYXRpdmUiLCJkaXJEZXN0IiwibWFwVXJsU3RyaW5nQmFzZSIsIm1hcFVybFN0cmluZyIsInR5cGVEZXN0IiwiY29udGVudCIsImVuZHNXaXRoIiwicGFyc2VkTWFwIiwiaXNTdHJpbmciLCJtYXAiLCJKU09OIiwicGFyc2UiLCJyZWJ1aWx0TWFwIiwic3RyaW5naWZ5IiwicGljayIsIm91dHB1dE1hcCIsIm91dHB1dEZpbGVBc3luYyIsInRoZW4iXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBTUEsT0FBT0MsUUFBUSxNQUFSLENBQWI7QUFDQSxJQUFNQyxXQUFXRCxRQUFRLFVBQVIsQ0FBakI7QUFDQSxJQUFNRSxLQUFLRCxTQUFTRSxZQUFULENBQXNCSCxRQUFRLFVBQVIsQ0FBdEIsQ0FBWDtBQUNBLElBQU1JLElBQUlKLFFBQVEsUUFBUixDQUFWO0FBQ0EsSUFBTUssU0FBU0wsUUFBUSxXQUFSLENBQWY7O0FBRUFNLE9BQU9DLE9BQVAsR0FBaUIsU0FBU0MsZ0JBQVQsQ0FBMEJDLElBQTFCLEVBQWdDO0FBQy9DO0FBQ0EsTUFBTUMsVUFBVVgsS0FBS1ksSUFBTCxDQUFVTixPQUFPTyxPQUFqQixFQUEwQixZQUExQixFQUF3Q0gsS0FBS0ksYUFBN0MsQ0FBaEI7O0FBRUE7QUFDQSxNQUFNQyxTQUFTLE1BQU1mLEtBQUtnQixRQUFMLENBQWNOLEtBQUtPLE9BQW5CLEVBQTRCTixPQUE1QixDQUFyQjtBQUNBLE1BQU1PLG1CQUFtQix3QkFBd0JILE1BQWpEO0FBQ0EsTUFBTUksZUFBZVQsS0FBS1UsUUFBTCxLQUFrQixLQUFsQixVQUErQkYsZ0JBQS9CLGtCQUE0REEsZ0JBQWpGO0FBQ0FSLE9BQUtXLE9BQUwsSUFBZ0JoQixFQUFFaUIsUUFBRixDQUFXWixLQUFLVyxPQUFoQixFQUF5QixJQUF6QixJQUFpQ0YsWUFBakMsR0FBZ0QsT0FBT0EsWUFBdkU7O0FBRUE7QUFDQSxNQUFNSSxZQUFZbEIsRUFBRW1CLFFBQUYsQ0FBV2QsS0FBS2UsR0FBaEIsSUFBdUJDLEtBQUtDLEtBQUwsQ0FBV2pCLEtBQUtlLEdBQWhCLENBQXZCLEdBQThDZixLQUFLZSxHQUFyRTtBQUNBLE1BQU1HLGFBQWFGLEtBQUtHLFNBQUwsQ0FBZXhCLEVBQUV5QixJQUFGLENBQU9QLFNBQVAsRUFBa0IsU0FBbEIsRUFBNkIsVUFBN0IsRUFBeUMsT0FBekMsRUFBa0QsU0FBbEQsQ0FBZixDQUFuQjtBQUNBLE1BQU1RLFlBQVk1QixHQUFHNkIsZUFBSCxDQUFtQnJCLE9BQW5CLEVBQTRCaUIsVUFBNUIsQ0FBbEI7O0FBRUEsU0FBT0csVUFBVUUsSUFBVixDQUFlO0FBQUEsV0FBTXZCLElBQU47QUFBQSxHQUFmLENBQVA7QUFDRCxDQWhCRCIsImZpbGUiOiJvdXRwdXQtc291cmNlbWFwcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBibHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5jb25zdCBmcyA9IGJsdWViaXJkLnByb21pc2lmeUFsbChyZXF1aXJlKCdmcy1leHRyYScpKTtcbmNvbnN0IF8gPSByZXF1aXJlKCdsb2Rhc2gnKTtcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG91dHB1dFNvdXJjZW1hcHMoZmlsZSkge1xuICAvLyBHZXQgcGF0aHNcbiAgY29uc3QgbWFwUGF0aCA9IHBhdGguam9pbihjb25maWcuZGVzdERpciwgJ3NvdXJjZW1hcHMnLCBmaWxlLnNvdXJjZW1hcFBhdGgpO1xuXG4gIC8vIEFwcGVuZCBzb3VyY2VNYXBwaW5nVVJMIHRvIGZpbGVcbiAgY29uc3QgbWFwVXJsID0gJy8nICsgcGF0aC5yZWxhdGl2ZShmaWxlLmRpckRlc3QsIG1hcFBhdGgpO1xuICBjb25zdCBtYXBVcmxTdHJpbmdCYXNlID0gJyMgc291cmNlTWFwcGluZ1VSTD0nICsgbWFwVXJsO1xuICBjb25zdCBtYXBVcmxTdHJpbmcgPSBmaWxlLnR5cGVEZXN0ID09PSAnY3NzJyA/IGAvKiR7bWFwVXJsU3RyaW5nQmFzZX0gKi9gIDogYC8vJHttYXBVcmxTdHJpbmdCYXNlfWA7XG4gIGZpbGUuY29udGVudCArPSBfLmVuZHNXaXRoKGZpbGUuY29udGVudCwgJ1xcbicpID8gbWFwVXJsU3RyaW5nIDogJ1xcbicgKyBtYXBVcmxTdHJpbmc7XG5cbiAgLy8gUmVidWlsZCBzb3VyY2VtYXAgZm9yIGNvbnNpc3RlbmN5LCByZW1hcCBzb3VyY2VzLCB0aGVuIG91dHB1dFxuICBjb25zdCBwYXJzZWRNYXAgPSBfLmlzU3RyaW5nKGZpbGUubWFwKSA/IEpTT04ucGFyc2UoZmlsZS5tYXApIDogZmlsZS5tYXA7XG4gIGNvbnN0IHJlYnVpbHRNYXAgPSBKU09OLnN0cmluZ2lmeShfLnBpY2socGFyc2VkTWFwLCAndmVyc2lvbicsICdtYXBwaW5ncycsICduYW1lcycsICdzb3VyY2VzJykpO1xuICBjb25zdCBvdXRwdXRNYXAgPSBmcy5vdXRwdXRGaWxlQXN5bmMobWFwUGF0aCwgcmVidWlsdE1hcCk7XG5cbiAgcmV0dXJuIG91dHB1dE1hcC50aGVuKCgpID0+IGZpbGUpO1xufVxuIl19