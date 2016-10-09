const path = require('path');
const _ = require('./util/lodash-extended');
const config = require('../config');
const getType = require('./util/get-type');
const getCompiledType = require('./util/get-compiled-type');

module.exports = group => _.assign(group, {files: _.map(group.files, normalize)});

function normalize(_path) {
  const p = {};
  p.srcPath = _path;
  p.destPath = path.join(config.destBase, p.srcPath);

  // If we're dealing with a directory, provide the minimum and return.
  const srcFilename = path.basename(_path);
  p.isFile = srcFilename.includes('.');

  if (!p.isFile) {
    p.srcDir = p.srcPath;
    p.destDir = p.destPath;
    return p;
  }

  // If not a directory, carry on.
  p.srcFilename = srcFilename;

  const srcExt = path.extname(p.srcFilename);

  p.srcDir = path.dirname(_path);
  p.basename = path.basename(p.srcFilename, srcExt);
  p.type = getType(srcExt);
  p.srcType = p.type;
  p.isMinified = path.extname(p.basename) === '.min';
  p.destDir = path.join(config.destBase, p.srcDir);
  p.destFilename = p.srcFilename;

  // Need to change a few things if the file will be compiled.
  const type = getCompiledType(p.type);

  if (type) {
    const filename = p.basename + '.' + type;
    p.shouldCompile = true;
    p.type = type;
    p.destFilename = filename;
    p.destPath = path.join(p.destDir, filename);
  }

  // Few differences for files that are already minified.
  if (!p.isMinified) {
    p.destFilenameMin = p.basename + '.min.' + p.type;
    p.destPathMin = path.join(p.destDir, p.destFilenameMin);
  }

  else {
    p.destFilenameMin = p.destFilename;
    p.destPathMin = p.destPath;
    p.basename = path.basename(p.basename, '.min');
  }

  return p;
}
