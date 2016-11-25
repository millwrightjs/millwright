const path = require('path');
const _ = require('../lib/lodash-extended');
const config = require('../config');
const util = require('../lib/util');

module.exports = remapSources;

function remapSources(task, file) {
  const build = task === 'build';
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  parsedMap.sources = _.map(parsedMap.sources, source => {
    const strippedPath = util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
    return build ? strippedPath : path.relative(file.destDir, path.join(config.destBase, strippedPath));
  });
  const map = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  return _.assign(file, {map});
}
