const path = require('path');
const _ = require('lodash');
const pathExists = require('path-exists').sync;

const destDir = 'dest';

module.exports = function(group) {
  return group.map(src => {
    return _(src)
      .thru(decoratePath)
      .thru(decoratePathMin)
      .thru(addDest)
      .thru(addDestMin)
      .value();
  });
};

function decoratePath(_path) {
  const ext = path.extname(_path);
  const decoratedPath = {
    ext,
    path: src,
    filename: path.basename(_path),
    dir: path.dirname(_path),
    filenameStripped: path.basename(_path, ext),
    isDir: !ext
  };
  if (!isDir) decoratedPath.type = _.trimStart(ext, '.');
  return decoratedPath;
}

function decoratePathMin(_path) {
  const isMinified = _path.ext(_path.filenameStripped) === '.min';
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
  destMin.extMin = '.min' + pathObj.ext;
  destMin.pathMin = path.join(destDir, pathObj.dir, pathObj.filenameStripped + destMin.extMin);
  return _.assign(pathObj, destMin);
}

function getCompiledType(type) {
  const typeMap = {
    css: ['scss', 'sass', 'less', 'styl'],
    js: ['coffee']
  }
  return _.findKey(typeMap, _.includes(type));
}
