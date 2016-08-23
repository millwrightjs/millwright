const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const sass = require('node-sass');
const pathExists = require('path-exists');
const whicheverExists = require('./util/whichever-exists');

module.exports = function() {
  const dependenciesFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const dependencies = fs.readJsonSync(dependenciesFileName);
  const destDir = 'dest';
  const viewData = {};

  // Files referenced under the "copy" property should simply be copied, without
  // providing a reference in the template data.
  copy(dependencies.copy);
  _.unset(dependencies, 'copy');

  _.forEach(dependencies, (group, name) => processGroup(_.castArray(group), name));

  return viewData;

  function processGroup(group, name) {
    let destPaths = _.map(group, dependency => process(dependency));
    viewData[name] = _.flatten(destPaths);
  }

  function process(dep) {
    let data, destPath;

    if (_.isString(dep)) {
      return process({dest: '', src: dep});
    }

    if (_.isArray(dep.src)) {
      return _.map(dep.src, depSrc => process({dest: dep.dest, src: depSrc}));
    }

    return output(compile(dep));
  }

  function copy(dependencyRef) {
    let data, destPath;

    if (_.isString(dependencyRef)) {
      copy({dest: '', src: dependencyRef});
    } else if (_.isArray(dependencyRef)) {
      _.forEach(dependencyRef, dependency => copy(dependency));
    } else if (_.isObject(dependencyRef)) {
      const {src} = dependencyRef;
      let dest;

      if (_.isArray(src)) {
        _.forEach(src, depSrc => copy({dest: dependencyRef.dest, src: depSrc}));
        return;
      }

      dest = path.join(destDir, dependencyRef.dest);

      if (fs.statSync(src).isFile()) {
        output(compile({dest, src}));
      } else {
        dest += fs.statSync(src).isFile() ? '/' + path.basename(src) : '';
        fs.copySync(dependencyRef.src, dest, {dereference: true});
      }
    }
  }

  function compile(dependencyRef) {
    const {dest, src} = dependencyRef;
    const fileType = path.extname(src);
    let destPath, data;

    if (fileType === '.scss' || fileType === '.sass') {
      data = sass.renderSync({file: src}).css.toString();
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

  function isValidDependency(dependencyObj) {
    return _.has(dependencyObj, 'src');
  }
}
