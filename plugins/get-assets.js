const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const config = require('../config');

module.exports = getAssets;

function getAssets() {
  const {wrapperDataPath} = config;
  const assetGroups = _.mapValues(fs.readJsonSync(wrapperDataPath).files, group => {
    return _.map(group, file => {
      return path.normalize(path.join(path.dirname(wrapperDataPath), file));
    });
  });

  return _(assetGroups).map((assetGroup, groupKey) => {
    return _.map(assetGroup, path => ({groupKey, path}));
  }).flatten().value();
}
