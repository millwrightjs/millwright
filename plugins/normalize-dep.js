const path = require('path');
const _ = require('lodash');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = normalizeDep;

function normalizeDep(ref) {
  ref.srcStripped = stripIgnoredBasePath(ref.src, config.templateIgnoredBasePaths);
  ref.dirStripped = path.dirname(ref.srcStripped);
  ref.baseDest = ref.base;
  ref.extDest = ref.ext;
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
      ref.extDest = '.min.' + ref.typeDest;
      ref.baseDest = ref.name + ref.extDest;
      ref.dest = path.join(ref.dirDest, ref.base);
    }

    const consumerName = path.basename(ref.consumer, '.json');
    const consumerDir = path.dirname(path.relative(path.join(process.cwd(), config.srcDir), ref.consumer));
    const forWrapper = consumerName === 'wrapper';

    ref.uniquePathPortion = _.trimStart(path.relative(consumerDir, ref.dirStripped), path.sep + '.');
    ref.dirDest = forWrapper ? consumerDir : path.join(consumerDir, ref.uniquePathPortion);

    const pagePrefix = ref.forWrapper ? '' : consumerName + '-';
    const webPathPrefix = ref.forWrapper ? '/' + ref.dirDest : '';

    ref.dirDest = path.join(config.destBase, ref.dirDest);
    ref.filenameDest = pagePrefix + ref.groupKey + ref.extDest;
    ref.dest = path.join(ref.dirDest, ref.filenameDest);
    ref.webPath = path.join(webPathPrefix, ref.filenameDest);
    ref.sourcemapPath = ref.webPath + '.map';
  }

  return ref;
}
