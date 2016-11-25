const config = require('../config');
const util = require('../lib/util');
const path = require('path');
const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(group) {
  const concatenated = group.files.then(concatenate);
  return _.assign(group, {files: [concatenated]});

  function concatenate(files) {
    const c = new Concat(true, group.destFilenameMin, '\n');
    _.forEach(files, file => {
      const mappedPath = util.stripIgnoredBasePath(file.srcPath, config.templateIgnoredBasePaths);
      c.add(mappedPath, file.content, file.map);
    });
    return {
      content: c.content.toString(),
      map: c.sourceMap,
      destPath: group.destPath,
      destDir: group.destDir,
      destFilenameMin: group.destFilenameMin,
      destPathMin: group.destPathMin,
      webPath: group.webPath,
      sourcemapPath: group.sourcemapPath,
      destType: group.destType,
      isCode: true
    };
  }
}
