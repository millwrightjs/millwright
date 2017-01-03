const config = require('../config');
const util = require('../utils/util');
const path = require('path');
const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(assets) {
  const groupWebPaths = _(assets).map('groupWebPath').uniq().value();

  return _.reduce(groupWebPaths, (acc, groupWebPath) => {
    const group = _.filter(assets, {groupWebPath});
    return _.concat(acc, concatenate(group));
  }, []);

  function concatenate(group) {
    const sample = group[0];
    const result = {
      dirDest: sample.groupDestDir,
      destFilename: sample.groupDestFilename,
      groupKey: sample.groupKey,
      destType: sample.typeDest,
      destFilenameMin: sample.groupDestFilename,
      dest: sample.dest,
      webPath: sample.groupDestPath,
      sourcemapPath: sample.groupSourcemapPath
    };

    const c = new Concat(true, result.dest, '\n');
    _.forEach(group, asset => {
      const mappedPath = util.stripIgnoredBasePath(asset.src, config.templateIgnoredBasePaths);
      c.add(mappedPath, asset.content, asset.map);
    });

    result.content = c.content.toString();
    result.map = c.sourceMap;

    return result;
  }
}
