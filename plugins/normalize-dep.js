const path = require('path');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = normalizeDep;

function normalizeDep(ref) {
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.templateIgnoredBasePaths);
  ref.dest = path.join(config.destBase, ref.srcStripped);
  ref.dirDest = path.dirname(ref.dest);
  ref.baseDest = ref.base;
  ref.destExt = ref.ext;
  const type = getType(ref.ext);
  ref.typeDest = type;
  const compiledType = getCompiledType(ref.type);
  if (compiledType) {
    ref.typeDest = compiledType;
    ref.extDest = '.' + ref.typeDest;
    ref.baseDest = ref.name + ref.extDest;
  }
  ref.isMinified = path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }
  if (!ref.isMinified) {
    ref.base = ref.name + '.min.' + ref.typeDest;
    ref.dest = path.join(ref.dirDest, ref.base);
  }

  const extDestMin = '.min' + ref.destExt;

  // Group attributes for minification/concatenation
  const dirStripped = path.dirname(ref.srcStripped);
  const basePathStripped = stripIgnoredBasePath(ref.baseDir, config.templateIgnoredBasePaths);
  const pagePrefix = ref.forWrapper ? '' : path.basename(ref.data, '.json') + '-';
  const groupWebPathPrefix = ref.forWrapper ? '/' + basePathStripped : '';

  ref.sourcemapPath = path.join(ref.dirStripped, ref.baseDest + '.map');
  ref.groupDestDir = path.join(config.destBase, basePathStripped);
  ref.groupDestFilename = pagePrefix + ref.groupKey + ref.extDestMin;
  ref.groupDestPath = path.join(ref.groupDestDir, ref.groupDestFilename);
  ref.groupWebPath = path.join(groupWebPathPrefix, ref.groupDestFilename);
  ref.groupSourcemapPath = ref.groupWebPath + '.map';

  return ref;
}
