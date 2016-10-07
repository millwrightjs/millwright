const _ = require('lodash');

module.exports = function(group, key) {
  const sampleType = group.files[0].type;
  const typesMatch = _.every(group.files, ['type', sampleType]);
  const type = typesMatch ? sampleType : null;
  return _.assign(group, {key, type});
}
