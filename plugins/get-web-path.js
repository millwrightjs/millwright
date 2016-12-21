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

  if (process.env.task === 'build') {
    const forWrapper = dataFile.name === 'wrapper';
    const basePathStripped = stripIgnoredBasePath(dataFile.dir, config.templateIgnoredBasePaths);
    const prefix = forWrapper ? '' : dataFile.name + '-';
    const pathBase = forWrapper ? '/' + basePathStripped : '';

    ref.ext = '.min' + ref.ext;
    ref.base = prefix + groupKey + ref.ext;

    return path.join(pathBase, ref.base);
  } else {
    const srcStripped = stripIgnoredBasePath(refPath, config.templateIgnoredBasePaths);
    ref.isMinified = path.extname(ref.name) === '.min';

    if (ref.isMinified) {
      ref.name = path.basename(ref.name, '.min');
    }

    return '/' + path.join(path.dirname(srcStripped), ref.base);
  }
}
