const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');

module.exports = function copyDirs(group) {
  return _.map(group.files, file => fs.copy(file.srcPath, file.destPath, {dereference: true}));
};
