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
  ref.isMinified = ref.isMinified || path.extname(ref.name) === '.min';
  if (ref.isMinified) {
    ref.name = path.basename(ref.name, '.min');
  }
  ref.basePathStripped = stripIgnoredBasePath(ref.baseDir, config.assetIgnoredBasePaths);

  // set dest directory
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.assetIgnoredBasePaths);
  ref.dirDest = path.join(config.destDir, path.dirname(ref.srcStripped));

  if (process.env.task === 'build' && !ref.isMinified) {
    ref.baseDest = ref.name + '.min.' + ref.typeDest;
  }

  ref.dest = path.join(ref.dirDest, ref.baseDest);
  ref.destResolved = path.resolve(ref.dest);

  return ref;
}
