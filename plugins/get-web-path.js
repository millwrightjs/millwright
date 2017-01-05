const _ = require('lodash');
const path = require('path');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = getWebPath;

function getWebPath(refPath, dataFile, groupKey) {
  const ref = path.parse(refPath);
  const type = getType(ref.ext);
  const compiledType = getCompiledType(type);

  if (compiledType) {
    ref.ext = '.' + compiledType;
    ref.base = ref.name + ref.ext;
  }

  const forWrapper = dataFile.name === 'wrapper';
  const basePathStripped = stripIgnoredBasePath(dataFile.dir, config.templateIgnoredBasePaths);
  const prefix = forWrapper ? '' : dataFile.name + '-';
  const pathBase = forWrapper ? '/' + basePathStripped : '';

  if (process.env.task === 'build') {
    ref.base = prefix + groupKey + '.min' + ref.ext;
    return path.join(pathBase, ref.base);
  } else {
    const srcStripped = stripIgnoredBasePath(refPath, config.templateIgnoredBasePaths);
    const dirStripped = path.dirname(srcStripped);

    ref.dest = path.join(path.dirname(srcStripped), ref.base);

    // Fix dest for assets that are above the src directory, such as node modules
    const consumerDir = path.dirname(path.relative(path.join(process.cwd(), config.srcDir), dataFile.srcResolved));

    const uniquePathPortion = _.trimStart(path.relative(consumerDir, dirStripped), path.sep + '.');

    if (!dirStripped.startsWith(consumerDir)) {
      ref.dest = path.join(consumerDir, ref.dest);
    }

    return '/' + ref.dest;
  }
}
