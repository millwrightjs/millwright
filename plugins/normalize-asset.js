const path = require('path');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = normalizeAsset;

function normalizeAsset(ref) {
  ref.type = getType(ref.ext);
  ref.typeDest = ref.type;
  ref.baseDest = ref.base;
  const compiledType = getCompiledType(ref.type);
  if (compiledType) {
    ref.typeDest = compiledType;
    ref.baseDest = ref.name + '.' + ref.typeDest;
  }
  ref.isMinified = path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }
  if (!ref.isMinified) {
    ref.baseDest = ref.name + '.min.' + ref.typeDest;
  }
  ref.basePathStripped = stripIgnoredBasePath(ref.baseDir, config.templateIgnoredBasePaths);

  // set dest directory
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.templateIgnoredBasePaths);
  ref.dest = path.join(config.destBase, ref.srcStripped);
  ref.dirDest = path.dirname(ref.dest);

  return ref;
}
