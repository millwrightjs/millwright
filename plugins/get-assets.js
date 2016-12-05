const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const config = require('../config');

module.exports = getAssets;

function getAssets(filesObject) {
  return _(filesObject).map((groups, key) => {
    const basePath = path.dirname(key);
    return _.map(groups, (group, groupKey) => {
      return _.map(group, assetPath => {
        return {groupKey, path: path.normalize(path.join(basePath, assetPath))};
      });
    });
  }).flattenDeep().value();
}
