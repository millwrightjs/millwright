const fs = require('fs');
const path = require('path');
const pathExists = require('path-exists').sync;

module.exports = statify;

function statify(mapping) {
  const {src, dest} = mapping;

  if (!pathExists(src)) {
    throw Error(path.resolve(src) + ' does not exist.');
  }

  const srcModel = {
    path: src,
    isFile: isFile(targetPath),
    isDirectory: isDirectory(targetPath)
  }

  if (srcModel.isFile) {
    srcModel.extname = path.extname(src);
    srcModel.basename = path.basename(src);
    srcModel.dirname = path.dirname(src);
    srcModel.type = _.trimStart(path.extname(src), '.'),
    srcModel.basenameStripped = path.basename(src, srcModel.extname);
    srcModel.isMinified = path.extname(srcModel.basenameStripped) === '.min';
  }

  if (srcModel.isMinified) {
    srcModel.basenameMin = srcModel.basename;
    srcModel.minPath = src;
    srcModel.minPathExists = true;
  } else {
    model.basenameMin = model.basenameStripped + '.min' + model.extname;
    model.minPath = path.join(model.dirname, model.basenameMin);
    model.minPathExists = pathExists(model.minPath);
  }

  return {src: srcModel, dest: destModel};
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
