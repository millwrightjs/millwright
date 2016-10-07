const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;

const destDir = 'dest';

module.exports = function(group) {

  const files = _(group.files)
    .map(getSrc)
    .map(getCommon)
    .map(getDest)
    .map(getCompiled)
    .map(getMin)
    .value();

  return _.assign(group, {files});
};

function getSrc(_path) {
  const ext = path.extname(_path);
  return {
    src: {
      ext,
      path: _path,
      filename: path.basename(_path),
      dir: path.dirname(_path)
    }
  };
}

function getCommon(pathObj) {
  const {ext, path: _path} = pathObj.src;
  const type = _.trimStart(ext, '.');
  const filenameStripped = path.basename(_path, ext);
  return _.assign(pathObj, {
    type,
    sourceType: type,
    filenameStripped,
    isDir: !ext,
    isMinified: path.extname(filenameStripped) === '.min'
  });
}

function getDest(pathObj) {
  const {src} = pathObj;
  return _.assign(pathObj, {
    dest: {
      dir: path.join(destDir, src.dir),
      path: path.join(destDir, src.path),
      ext: src.ext,
      filename: src.filename
    }
  });
}

function getCompiled(pathObj) {
  const type = getCompiledType(pathObj.type);
  if (type) {
    const ext = '.' + type;
    const filename = pathObj.filenameStripped + ext;
    pathObj.type = type;
    pathObj.dest = _.assign(pathObj.dest, {
      ext,
      filename,
      path: path.join(pathObj.dest.dir, filename)
    });
  }
  return pathObj;
}

function getMin(pathObj) {
  const {dest} = pathObj;
  const extMin = '.min' + dest.ext;
  const pathMin = path.join(dest.dir, pathObj.filenameStripped + extMin);

  pathObj.dest = _.assign(pathObj.dest, {extMin, pathMin});
  return pathObj;
}

function getCompiledType(type) {
  const typeMap = {
    css: ['scss', 'sass', 'less', 'styl'],
    js: ['coffee']
  }
  return _.findKey(typeMap, types => _.includes(types, type));
}
