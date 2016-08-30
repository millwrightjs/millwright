const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const pathExists = require('path-exists').sync;
const whicheverExists = require('./util/whichever-exists');

const destDir = 'dest';

module.exports = function() {
  const mappingsFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const mappings = fs.readJsonSync(mappingsFileName).files;
  const normalizedMappings = _(mappings)
    .mapValues(_.mapper(normalizeMapping))
    .mapValues(_.mapper(objectifyMapping))
    .mapValues(_.mapper(finalizeMapping))
    .value();

  return normalizedMappings;
};

function normalizeMapping(mapping) {
  if (_.isString(mapping)) {
    return {dest: '', src: mapping};
  } else if (_.isObject(mapping) && _.isArray(mapping.src)) {
    return _.map(mapping.src, src => ({dest: mapping.dest || '', src}));
  } else if (_.isObject(mapping)) {
    return {dest: mapping.dest || '', src: mapping.src};
  }
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
    srcModel.minPath = src;
    srcModel.minPathExists = true;
  } else {
    srcModel.basenameMin = srcModel.basenameStripped + '.min' + srcModel.extname;
    srcModel.minPath = path.join(srcModel.dirname, srcModel.basenameMin);
    srcModel.minPathExists = pathExists(srcModel.minPath);
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
    sass: 'css'
  };

  const compiledType = typeMap[dest.type];

  if (compiledType) {
    dest.type = compiledType;
    dest.extname = '.' + compiledType;
    dest.basename = dest.basenameStripped + dest.extname;
    dest.path = path.join(dest.dirname, dest.basename);
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
  mapping.dest.path = path.join(destDir, mapping.dest.path);
  return mapping;
}
