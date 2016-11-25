const _ = require('lodash');

module.exports = function toWebPaths(assets) {
  return _(assets)
    .filter('isCode')
    .reduce((acc, asset) => {
      acc[asset.groupKey] = acc[asset.groupKey] || [];
      acc[asset.groupKey].push(asset.webPath);
      return acc;
    }, {});
}
