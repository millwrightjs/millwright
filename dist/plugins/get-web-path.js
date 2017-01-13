'use strict';

var _ = require('lodash');
var path = require('path');
var config = require('../config');

var _require = require('../utils/util'),
    getCompiledType = _require.getCompiledType,
    getType = _require.getType,
    stripIgnoredBasePath = _require.stripIgnoredBasePath;

module.exports = getWebPath;

function getWebPath(refPath, dataFile, groupKey) {
  var ref = path.parse(refPath);
  var type = getType(ref.ext);
  var compiledType = getCompiledType(type);

  if (compiledType) {
    ref.ext = '.' + compiledType;
    ref.base = ref.name + ref.ext;
  }

  var forWrapper = dataFile.name === 'wrapper';
  var basePathStripped = stripIgnoredBasePath(dataFile.dir, config.assetIgnoredBasePaths);
  var prefix = forWrapper ? '' : dataFile.name + '-';
  var pathBase = forWrapper ? '/' + basePathStripped : '';

  // Fix dest for assets that are above the src directory, such as node modules
  var consumerDir = path.dirname(path.relative(path.join(process.cwd(), config.srcDir), dataFile.srcResolved));

  if (process.env.task === 'build') {
    ref.base = prefix + groupKey + '.min' + ref.ext;
    return '/' + path.join(consumerDir, ref.base);
  } else {
    var srcStripped = stripIgnoredBasePath(refPath, config.assetIgnoredBasePaths);
    var dirStripped = path.dirname(srcStripped);
    var uniquePathPortion = _.trimStart(path.relative(consumerDir, dirStripped), path.sep + '.');

    ref.dest = path.join(path.dirname(srcStripped), ref.base);

    if (!dirStripped.startsWith(consumerDir)) {
      ref.dest = path.join(consumerDir, ref.dest);
    }

    return '/' + ref.dest;
  }
}