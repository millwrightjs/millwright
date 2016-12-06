const config = require('../config');
const util = require('../utils/util');
const path = require('path');
const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(assets) {
  const groupDestFilenames = _(assets).map('groupDestFilename').uniq().value();

  return _.reduce(groupDestFilenames, (acc, groupDestFilename) => {
    const group = _.filter(assets, {groupDestFilename});
    return _.concat(acc, concatenate(group));
  }, []);

  function concatenate(group) {
    const sample = group[0];
    const result = {
      destDir: sample.groupDestDir,
      destFilename: sample.groupDestFilename,
      destPath: sample.groupDestPath,
      groupKey: sample.groupKey,
      destType: sample.destType,
      destFilenameMin: sample.groupDestFilename,
      destPathMin: sample.groupDestPath,
      webPath: sample.groupDestPath,
      sourcemapPath: sample.groupSourcemapPath
    };

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
