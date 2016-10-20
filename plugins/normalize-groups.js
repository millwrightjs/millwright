const path = require('path');
const _ = require('lodash');
const config = require('../config');

module.exports = function(group, key) {
  const result = {key, dir: config.destBase};
  const sampleType = group.files[0].type;
  const typesMatch = _.every(group.files, ['type', sampleType]);

  result.allFiles = _.every(group.files, 'isFile');

  if (result.allFiles && typesMatch) {
    result.type = sampleType;

    const ext = '.' + sampleType;
    const extMin = '.min' + ext;

    result.filename = key + ext;
    result.path = path.join(result.dir, result.filename);
    result.filenameMin = key + extMin;
    result.pathMin = path.join(result.dir, result.filenameMin);

    result.shouldConcat = true;
  }

  return _.assign(group, result);
}
