const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;

module.exports = objectifyMapping;

function objectifyMapping(mapping) {
  const {src, dest} = mapping;

  if (!pathExists(src)) {
    throw Error(path.resolve(src) + ' does not exist.');
  }

  const srcModel = getPathAttributes(src);
  const destModel = getPathAttributes(dest);

  srcModel.isMinified = path.extname(srcModel.basenameStripped) === '.min';

  if (srcModel.isMinified) {
    // Strip .min from end of basename
    srcModel.basename = path.basename(srcModel.basename);
    srcModel.basenameMin = srcModel.basename;
    srcModel.minPath = src;
    srcModel.minPathExists = true;
  } else {
    srcModel.basenameMin = srcModel.basenameStripped + '.min' + srcModel.extname;
    srcModel.minPath = path.join(srcModel.dirname, srcModel.basenameMin);
    srcModel.minPathExists = pathExists(srcModel.minPath);
  }

  return {src: srcModel, dest: destModel};
}

function getPathAttributes(targetPath) {
  const extname = path.extname(targetPath);

  return {
    extname,
    path: targetPath,
    basename: path.basename(targetPath),
    dirname: path.dirname(targetPath),
    type: _.trimStart(extname, '.'),
    basenameStripped: path.basename(targetPath, extname),
    isFile: !!extname,
    isDirectory: !extname
  };
}

function isFile(targetPath) {
  try {
    return fs.statSync(targetPath).isFile();
  }
  catch(e){}
}

function isDirectory(targetPath) {
  try {
    return fs.statSync(targetPath).isDirectory();
  }
  catch(e){}
}
