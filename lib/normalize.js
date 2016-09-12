const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const pathExists = require('path-exists').sync;
const whicheverExists = require('./util/whichever-exists');
const getOrdinal = require('./util/get-ordinal');

const destDir = 'dest';

module.exports = function(optimize) {
  const mappingsFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const mappings = fs.readJsonSync(mappingsFileName);
  const normalizedMappings = {};
  normalizedMappings.assets = _(mappings)
    .tap(validateMapping)
    .map(flattenMapping)
    .flattenDeep()
    .map(objectifyMapping)
    .map(finalizeMapping)
    .value();

  normalizedMappings.webPaths = _(normalizedMappings.assets)
    .map(_.partial(getWebPaths, optimize))
    .reject(_.isNil)
    .value();

  return normalizedMappings;
};

function flattenMapping(mapping, key) {
  return mapping.map(fileInfo => _.set(fileInfo, 'key', key));
}

function validateMapping(mappings) {
  _.forEach(mappings, (mapping, key) => {
    if (!_.isArray(mapping)) {
      throw Error('Value for ' + key + ' must be an array.');
    }

    mapping.forEach((fileInfo, index) => {
      if (!_.isObject(fileInfo)) {
        throw Error(key + ' array must only contain objects.');
      }

      if (!_.has(fileInfo, 'src')) {
        throw Error(getOrdinal(index + 1) + ' element in ' + key + ' array has no src property.');
      }

      if (!_.has(fileInfo, 'dest')) {
        throw Error(getOrdinal(index + 1) + ' element in ' + key + ' array has no dest property.');
      }
    });
  });
}

function objectifyMapping(mapping) {
  const {src, dest} = mapping;

  if (!pathExists(src)) {
    throw Error(path.resolve(src) + ' does not exist.');
  }

  const srcModel = getSrcAttributes(src);
  const destComplete = completeDestPath(dest, srcModel);
  const destModel = toCompiledType(getDestAttributes(destComplete));

  return {src: srcModel, dest: destModel};
}

function getSrcAttributes(src) {
  const extname = path.extname(src);

  const srcModel = {
    extname,
    path: src,
    basename: path.basename(src),
    dirname: path.dirname(src),
    type: _.trimStart(extname, '.'),
    basenameStripped: path.basename(src, extname),
    isFile: !!extname,
    isDirectory: !extname
  };

  srcModel.isMinified = path.extname(srcModel.basenameStripped) === '.min';

  if (srcModel.isMinified) {
    // Strip .min from end of basename
    srcModel.basename = path.basename(srcModel.basename);
    srcModel.basenameMin = srcModel.basename;
    srcModel.pathMin = src;
    srcModel.pathMinExists = true;
  } else {
    srcModel.basenameMin = srcModel.basenameStripped + '.min' + srcModel.extname;
    srcModel.pathMin = path.join(srcModel.dirname, srcModel.basenameMin);
    srcModel.pathMinExists = pathExists(srcModel.pathMin);
  }

  return srcModel;
}

function completeDestPath(dest, src) {
  if (!path.extname(dest) && src.extname) {
    dest = path.join(dest, src.basename);
  }

  return dest;
}

function toCompiledType(dest) {
  const typeMap = {
    scss: 'css',
    sass: 'css',
    js: 'js',
    css: 'css'
  };

  const compiledType = typeMap[dest.type];

  if (compiledType) {
    dest.type = compiledType;
    dest.extname = '.' + compiledType;
    dest.basename = dest.basenameStripped + dest.extname;
    dest.path = path.join(dest.dirname, dest.basename);

    if (path.extname(dest.basenameStripped) === '.min') {
      dest.basenameStripped = path.basename(dest.basenameStripped, '.min');
    }

    dest.pathMin = path.join(dest.dirname, dest.basenameStripped + '.min' + dest.extname);
  }

  return dest;
}

function getDestAttributes(dest) {
  const extname = path.extname(dest);

  const destModel = {
    extname,
    path: dest,
    basename: path.basename(dest),
    dirname: path.dirname(dest),
    type: _.trimStart(extname, '.'),
    basenameStripped: path.basename(dest, extname),
    isFile: !!extname,
    isDirectory: !extname,
  };

  return destModel;
}

function finalizeMapping(mapping) {
  mapping.dest.webPath = mapping.dest.path;
  mapping.dest.webPathMin = mapping.dest.pathMin;
  mapping.dest.path = path.join(destDir, mapping.dest.path);
  mapping.dest.pathMin = path.join(destDir, mapping.dest.pathMin || '');
  return mapping;
}

function getWebPaths(optimize, mapping) {
  if (optimize && _.has(mapping.dest, 'webPathMin')) {
    return mapping.dest.webPathMin;
  }

  if (!optimize && _.has(mapping.dest, 'webPath')) {
    return mapping.dest.webPath;
  }
}
