const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');

module.exports = getAssets;

function getAssets() {
  const pathsSource = 'src/wrapper.json';
  const assetGroups = _.mapValues(fs.readJsonSync(pathsSource), paths => {
    return _.map(paths, _path => path.normalize(path.join(path.dirname(pathsSource), _path)));
  });

  return _(assetGroups)
    .map((assetGroup, groupKey) => _.map(assetGroup, path => ({groupKey, path}))).flatten().value();
}
