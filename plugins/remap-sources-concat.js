const _ = require('../lib/lodash-extended');
const config = require('../config');
const util = require('../lib/util');

module.exports = function remapSourcesConcat(file) {
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  parsedMap.sources = _.map(parsedMap.sources, source => {
    return util.stripIgnoredBasePath(source, config.templateIgnoredBasePaths);
  });
  const map = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  return _.assign(file, {map});
}
