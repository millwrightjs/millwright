const _ = require('lodash');
const cache = require('../utils/cache');

module.exports = getAssetContent;

function getAssetContent(dep) {
  const {content, map, mapImports} = cache.get('files', dep.srcResolved);
  return _.assign({}, dep, {content, map, mapImports});
}
