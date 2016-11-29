const config = require('../config');
const util = require('../utils/util');
const path = require('path');
const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(assets) {
  const groupKeys = _(assets).map('groupKey').uniq().value();

  return _.reduce(groupKeys, (acc, groupKey) => {
    const group = _.filter(assets, {groupKey});
    const sample = group[0];
    const shouldConcat = _.every(group, asset => asset.isCode && asset.destType === sample.destType);
    return _.concat(acc, shouldConcat ? concatenate(group) : group);
  }, []);

  function concatenate(group) {
    const sample = group[0];
    const result = {};

    result.destDir = config.destBase;
    result.destFilename = sample.groupKey + sample.destExtMin;
    result.destPath = path.join(result.destDir, result.destFilename);
    result.groupKey = sample.groupKey;
    result.destType = sample.destType;
    result.destFilenameMin = result.destFilename;
    result.destPathMin = result.destPath;
    result.webPath = result.destFilename;
    result.sourcemapPath = result.webPath + '.map';
    result.isCode = true;

    const c = new Concat(true, result.destPath, '\n');
    _.forEach(group, asset => {
      const mappedPath = util.stripIgnoredBasePath(asset.srcPath, config.templateIgnoredBasePaths);
      c.add(mappedPath, asset.content, asset.map);
    });

    result.content = c.content.toString();
    result.map = c.sourceMap;

    return result;
  }
}
