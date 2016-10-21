const _ = require('lodash');
const Concat = require('concat-with-sourcemaps');

module.exports = function concat(group) {
  const concatenated = group.files.then(concatenate);
  return _.assign(group, {files: concatenated});

  function concatenate(files) {
    const c = new Concat(true, group.destFilenameMin, '\n');
    _.forEach(files, file => c.add(file.destFilenameMin, file.content, file.map));
    return {
      content: c.content.toString(),
      map: c.sourceMap,
      destDir: group.destDir,
      destFilenameMin: group.destFilenameMin,
      destPathMin: group.destPathMin,
      webPath: group.webPath
    };
  }
}
