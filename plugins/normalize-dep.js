const path = require('path');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = normalizeDep;

function normalizeDep(ref) {
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.templateIgnoredBasePaths);
  ref.dirStripped = path.dirname(ref.srcStripped);
  ref.baseDest = ref.base;
  ref.destExt = ref.ext;
  const type = getType(ref.ext);
  ref.typeDest = type;
  const compiledType = getCompiledType(type);
  if (compiledType) {
    ref.typeDest = compiledType;
    ref.extDest = '.' + ref.typeDest;
    ref.baseDest = ref.name + ref.extDest;
  }
  ref.isMinified = path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }

  ref.dest = path.join(config.destBase, ref.dirStripped, ref.baseDest);
  ref.dirDest = path.dirname(ref.dest);

  ref.sourcemapPath = path.join(ref.dirStripped, ref.baseDest + '.map');

  if (process.env.task === 'build') {
    if (!ref.isMinified) {
      ref.base = ref.name + '.min.' + ref.typeDest;
      ref.dest = path.join(ref.dirDest, ref.base);
    }

    const extDestMin = '.min' + ref.destExt;

    // Group attributes for minification/concatenation
    const basePathStripped = stripIgnoredBasePath(ref.baseDir, config.templateIgnoredBasePaths);
    const pagePrefix = ref.forWrapper ? '' : path.basename(ref.data, '.json') + '-';
    const groupWebPathPrefix = ref.forWrapper ? '/' + basePathStripped : '';


    ref.groupDestDir = path.join(config.destBase, basePathStripped);
    ref.groupDestFilename = pagePrefix + ref.groupKey + ref.extDestMin;
    ref.groupDestPath = path.join(ref.groupDestDir, ref.groupDestFilename);
    ref.groupWebPath = path.join(groupWebPathPrefix, ref.groupDestFilename);
    ref.groupSourcemapPath = ref.groupWebPath + '.map';
  }

  return ref;
}
