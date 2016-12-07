const path = require('path');
const _ = require('lodash');

module.exports = getWatchFiles;

function getWatchFiles(watchFiles, assets) {
  _.forEach(assets, asset => {
    watchFiles[path.resolve(asset.srcPath)] = {
      path: asset.srcPath,
      dataFilePath: asset.dataFilePath
    };
    _.forEach(asset.mapImports, imported => watchFiles[path.resolve(imported)] = {
      path: asset.srcPath,
      dataFilePath: asset.dataFilePath
    });
  });
}
