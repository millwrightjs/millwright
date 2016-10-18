const path = require('path');
const _ = require('./lodash-extended');
const config = require('../config');
const {getCompiledType, getType, stripIgnoredBasePath} = require('./util');

module.exports = group => _.assign(group, {files: _.map(group.files, normalize)});

function normalize(_path) {
  const pathObj = base(_path);

  if (pathObj.isFile) {
    return _(pathObj)
      .thru(isFile)
      .thruIf(getCompiledType, compiledType)
      .thruIfElse('isMinified', isMinified, isNotMinified)
      .thru(webPath)
      .value();
  }

  return isNotFile(pathObj);

  function base(p) {
    const srcPathStripped = stripIgnoredBasePath(p, config.templateIgnoredBasePaths);
    const filename = path.basename(p);
    return {
      srcPathStripped,
      srcPath: p,
      destPath: path.join(config.destBase, srcPathStripped),
      isFile: filename.includes('.')
    };
  }

  function isNotFile(p) {
    const assigned = {
      srcDir: p.srcPath,
      destDir: p.destPath
    }
    return _.assign(p, assigned);
  }

  function isFile(p) {
    const srcFilename = path.basename(p.srcPath);
    const srcExt = path.extname(srcFilename);
    const basename = path.basename(srcFilename, srcExt);
    const srcDir = path.dirname(p.srcPath);
    const srcType = getType(srcExt);
    const assigned = {
      srcFilename,
      srcDir,
      srcType,
      basename,
      type: srcType,
      isMinified: path.extname(basename) === '.min',
      destDir: path.dirname(p.destPath),
      destFilename: srcFilename
    };
    return _.assign(p, assigned);
  }

  function compiledType(p, compiledType) {
    const destFilename = p.basename + '.' + compiledType;
    const assigned = {
      destFilename,
      type: compiledType,
      destPath: path.join(p.destDir, destFilename)
    };

    return _.assign(p, assigned);
  }

  function isMinified(p) {
    const assigned = {
      destFilenameMin: p.destFilename,
      destPathMin: p.destPath,
      basename: path.basename(p.basename, '.min')
    };

    return _.assign(p, assigned);
  }

  function isNotMinified(p) {
    const destFilenameMin = p.basename + '.min.' + p.type;
    const assigned = {
      destFilenameMin,
      destPathMin: path.join(p.destDir, destFilenameMin)
    };

    return _.assign(p, assigned);
  }

  function webPath(p) {
    const assigned = {
      webPath: path.join(path.dirname(p.srcPathStripped), p.destFilename)
    };
    return _.assign(p, assigned);
  }
}
