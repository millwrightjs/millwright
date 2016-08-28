const fs = require('fs');
const path = require('path');
const pathExists = require('path-exists').sync;

module.exports = {
  isMinified,
  withMinified,
  getType,
  isFile,
  isDirectory
};

function isMinified(src) {
  src = modelPath(src);
  return path.extname(src.basenameStripped) === '.min';
}

function withMinified(src) {
  src = modelPath(src);
  return pathExists(path.join(src.dirname, src.basenameStripped + '.min' + src.extname));
}

function getType(targetPath) {
  return _.trim(path.extname(targetPath), '.');
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

function modelPath(targetPath) {
  const model = {
    extname: path.extname(targetPath),
    basename: path.basename(targetPath),
    dirname: path.dirname(targetPath)
  };

  model.basenameStripped = path.basename(targetPath, model.extname);

  return model;
}
