const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;

const destDir = 'dest';

module.exports = function(group) {
  return _(group)
    .map(decoratePath)
    .map(decoratePathMin)
    .map(addDest)
    .map(addDestMin)
    .value();
};

function decoratePath(_path) {
  const ext = path.extname(_path);
  const decoratedPath = {
    ext,
    path: _path,
    filename: path.basename(_path),
    dir: path.dirname(_path),
    filenameStripped: path.basename(_path, ext),
    isDir: !ext
  };
  if (!decoratedPath.isDir) decoratedPath.type = _.trimStart(ext, '.');
  return decoratedPath;
}

function decoratePathMin(_path) {
  const isMinified = path.extname(_path.filenameStripped) === '.min';
  if (isMinified) {
    return _.assign(_path, {isMinified: true});
  } else {
    const filenameMin = _path.filenameStripped + '.min' + _path.ext;
    const pathMin = path.join(_path.dir, filenameMin);
    return _.assign(_path, {
      filenameMin,
      pathMin,
      pathMinExists: pathExists(pathMin)
    });
  }
}

function addDest(_path) {
  const dest = {};
  console.log(_path);
  const compiledType = getCompiledType(_path.type);

  if (compiledType) {
    dest.type = compiledType;
    dest.ext = '.' + dest.type;
    dest.filename = _path.filenameStripped + dest.ext;
  }

  dest.dir = path.join(destDir, _path.dir);
  dest.path = path.join(destDir, _path.path);

  return {
    src: _path,
    dest: _.assign(_path, dest)
  };
}

function addDestMin(pathObj) {
  const destMin = {};
  destMin.extMin = '.min' + pathObj.dest.ext;
  destMin.pathMin = path.join(pathObj.dest.dir, pathObj.dest.filenameStripped + destMin.extMin);
  return _.assign(pathObj.dest, destMin);
}

function getCompiledType(type) {
  const typeMap = {
    css: ['scss', 'sass', 'less', 'styl'],
    js: ['coffee']
  }
  return _.findKey(typeMap, _.includes(type));
}
