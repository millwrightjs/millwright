const config = require('../config');
const util = require('../utils/util');
const path = require('path');
const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(assets) {
  const webPaths = _(assets).map('webPath').uniq().value();

  return _.reduce(webPaths, (acc, webPath) => {
    const group = _.filter(assets, {webPath});
    return _.concat(acc, concatenate(group));
  }, []);

  function concatenate(group) {
    const result = _.pick(group[0],
      ['dirDest', 'filenameDest', 'groupKey', 'typeDest', 'filenameDest', 'dest', 'webPath', 'sourcemapPath']);

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
