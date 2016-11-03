const path = require('path');
const _ = require('lodash');
const config = require('../config');

module.exports = function(group, key) {
  const result = {key, destDir: config.destBase};
  const sampleType = group.files[0].type;
  const typesMatch = _.every(group.files, ['type', sampleType]);

  result.allFiles = _.every(group.files, 'isFile');

  if (result.allFiles && typesMatch) {
    result.type = sampleType;

    const ext = '.' + sampleType;
    const extMin = '.min' + ext;

    result.destFilename = key + extMin;
    result.destFilenameMin = result.destFilename;
    result.destPath = path.join(result.destDir, result.destFilename);
    result.destPathMin = result.destPath;
    result.webPath = result.destFilename;
    result.sourcemapPath = result.webPath + '.map';

    result.shouldConcat = true;
  }

  return _.assign(group, result);
}
