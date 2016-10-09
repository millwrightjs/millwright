const _ = require('lodash');

module.exports = function normalizeSourcemap(file) {
  const {map} = file;
  const parsed = _.isString(map) ? JSON.parse(map) : map;
  const rebuiltMap = _.pick(parsed, 'version', 'mappings', 'names', 'sources');
  return JSON.stringify(rebuiltMap);
}
