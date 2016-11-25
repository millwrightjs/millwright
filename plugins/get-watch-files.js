const path = require('path');
const _ = require('lodash');

module.exports = getWatchFiles;

function getWatchFiles(watchFiles, assets) {
  _.forEach(assets, asset => {
    watchFiles[path.resolve(asset.srcPath)] = asset.srcPath;
    _.forEach(asset.mapImports, imported => watchFiles[path.resolve(imported)] = asset.srcPath);
  });
}
