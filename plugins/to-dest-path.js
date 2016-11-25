const path = require('path');
const _ = require('lodash');

module.exports = function toDestPath(asset) {
  return path.resolve(asset.destPath);
}
