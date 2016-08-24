const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const sass = require('node-sass');
const pathExists = require('path-exists');
const whicheverExists = require('./util/whichever-exists');
const uncastArray = require('./util/uncast-array');

module.exports = function() {
  const mappingsFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const mappings = fs.readJsonSync(mappingsFileName).files;
  const destDir = 'dest';
  const viewData = {};
  const normalizedMappings = _(mappings).mapValues(normalizeMapping).mapValues(finalizeDest).value();

  console.log(normalizedMappings);

  _.forEach(normalizedMappings, (group, name) => processGroup(_.castArray(group), name));

  return viewData;

  function processGroup(group, name) {
    let destPaths = _.map(group, dependency => process(dependency));
    viewData[name] = _.flatten(destPaths);
  }

  function process(dep) {
    return output(compile(dep));
  }

  function compile(dependency) {
    const {dest, src} = dependency;
    let data;

    if (src.extname === '.scss' || src.extname === '.sass') {
      data = sass.renderSync({file: src.pathname}).css.toString();
      dest.extname
      destPath = path.join(dest, path.basename(src, '.scss') + '.css');
    } else {
      destPath = dest;
    }

    return {data, destPath, src};
  }

  function output(compiled) {
    const {data, destPath, src} = compiled;

    if (data) {
      fs.outputFileSync(destPath, data);
    } else {
      fs.copySync(src, destPath + '/' + path.basename(src), {dereference: true});
    }

    return destPath;
  }

  function normalizeMapping(mapping) {
    if (_.isString(mapping)) {
      return normalizeMapping({dest: '', src: mapping});
    } else if (_.isArray(mapping)) {
      return _.map(mapping, normalizeMapping);
    } else if (_.isObject(mapping)) {
      const normalized = _.map(_.castArray(mapping.src), src => ({dest: mapping.dest, src}));
      return uncastArray(normalized);
    }
  }

  function finalizeDest(fileMapping) {
    fileMapping = _.castArray(fileMapping);
    const extMap = {
      scss: 'css',
      sass: 'css'
    };
    const result = _.map(fileMapping, mapping => {
      const extnameSrc = path.extname(mapping.src).substr(1);
      mapping.dest = path.join(destDir, mapping.dest);
      if (extnameSrc && !path.extname(mapping.dest)) {
        const extnameDest = extMap[extnameSrc] || extnameSrc;
        const basenameDest = path.basename(mapping.src, extnameSrc) + extnameDest;
        mapping.dest = path.join(mapping.dest, basenameDest);
      }
      return mapping;
    });
    return uncastArray(result);
  }

  function decoratePath(pathname) {
    const stat = pathExists.sync(pathname) && fs.statSync(pathname);
    const decorated = {
      pathname,
      dirname: path.dirname(pathname),
      basename: path.basename(pathname),
      extname: path.extname(pathname)
    };
    decorated.isFile = stat ? stat.isFile() : !!decorated.extname;
    decorated.isDirectory = stat ? stat.isDirectory() : !decorated.extname;
    decorated.basenameStripped = path.basename(decorated.basename, decorated.extname);
    return decorated;
  }

  function isValidDependency(dependencyObj) {
    return _.has(dependencyObj, 'src');
  }
}
