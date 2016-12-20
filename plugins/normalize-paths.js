const path = require('path');
const _ = require('lodash');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('../utils/util');

module.exports = normalize;

function normalize(ref) {
  const filename = path.basename(ref.path);

  ref.srcPathStripped = stripIgnoredBasePath(ref.path, config.templateIgnoredBasePaths);
  ref.srcDirStripped = path.dirname(ref.srcPathStripped);
  ref.srcPath = ref.path;
  ref.srcResolved = path.resolve(ref.path);
  ref.destPath = path.join(config.destBase, ref.srcPathStripped);
  ref.isFile = filename.includes('.');

  if (!ref.isFile) {
    ref.srcDir = ref.srcPath;
    ref.destDir = ref.destPath;
    return ref;
  }

  ref.srcFilename = path.basename(ref.srcPath);
  ref.srcExt = path.extname(ref.srcFilename);
  ref.basename = path.basename(ref.srcFilename, ref.srcExt);
  ref.srcDir = path.dirname(ref.srcPath);
  ref.srcType = getType(ref.srcExt);
  ref.destType = ref.srcType;
  ref.destExt = ref.srcExt;
  ref.destFilename = ref.srcFilename;
  ref.isMinified = path.extname(ref.basename) === '.min';
  ref.destDir = path.dirname(ref.destPath);

  const compiledType = getCompiledType(ref.srcType);

  if (compiledType) {
    ref.destType = compiledType;
    ref.destFilename = ref.basename + '.' + ref.destType;
    ref.destExt = '.' + ref.destType;
    ref.destPath = path.join(ref.destDir, ref.destFilename);
  }

  if (ref.isMinified) {
    ref.destFilenameMin = ref.destFilename;
    ref.destPathMin = ref.destPath;
    ref.basename = path.basename(ref.basename, '.min');
  }

  if (!ref.isMinified) {
    ref.destFilenameMin = ref.basename + '.min.' + ref.destType;
    ref.destPathMin = path.join(ref.destDir, ref.destFilenameMin);
  }

  // Sourcemap filename
  ref.sourcemapPath = path.join(ref.srcDirStripped, ref.destFilename + '.map');

  // Relative path for use in templates
  ref.webPath = '/' + path.join(path.dirname(ref.srcPathStripped), ref.destFilename);

  ref.isCode = ref.destType === 'css' || ref.destType === 'js';
  ref.shouldMinify = !ref.isMinified && ref.isCode;

  // Group attributes for minification/concatenation
  const basePathStripped = stripIgnoredBasePath(ref.baseDir, config.templateIgnoredBasePaths);
  const pagePrefix = ref.forWrapper ? '' : path.basename(ref.data, '.json') + '-';
  const groupWebPathPrefix = ref.forWrapper ? '/' + basePathStripped : '';

  ref.basePathStripped = basePathStripped;
  ref.destExtMin = '.min' + ref.destExt;
  ref.groupDestDir = path.join(config.destBase, basePathStripped);
  ref.groupDestFilename = pagePrefix + ref.groupKey + ref.destExtMin;
  ref.groupDestFilenameMin = ref.groupDestFilename;
  ref.groupDestPath = path.join(ref.groupDestDir, ref.groupDestFilename);
  ref.groupDestPathMin = ref.groupDestPath;
  ref.groupWebPath = path.join(groupWebPathPrefix, ref.groupDestFilename);
  ref.groupSourcemapPath = ref.groupWebPath + '.map';

  return ref;
}
