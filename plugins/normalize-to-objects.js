const _ = require('lodash');

module.exports = function(group) {
  return {files: _.get(group, 'files', group)};
};
