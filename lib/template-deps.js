const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify('fs-extra');
const sass = require('node-sass');
const less = require('less');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const coffee = require('coffee-script');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  if (optimize) {
    return Promise.all(mappings.reduce(processMapping, []))
      .then(result => result.reduce(concatMapping, {}))
      .then(result => {
        const promises = _.map(result, (file, key) => {
          return fs.outputFile(path.join('dest', key + file.ext), file.value);
        });
        return Promise.all(promises)
      });
  }
  return Promise.all(mappings.reduce(processMapping, []));

  function processMapping(accumulator, mapping) {
    const {dest, src, key} = mapping;
    let promise;

    if (src.isDirectory || (!shouldCompile(src.type) && !shouldPostProcess(dest.type) &&
        !(optimize && shouldMinify(dest.type)) && !(optimize && shouldConcat(dest.type)))) {
      promise = fs.copy(src.pathMinExists ? src.pathMin : src.path, dest.path, {dereference: true});
    }

    else {
      promise = fs.readFile(src.path, 'utf8')
        .then(result => {
          if (shouldCompile(src.type) && !(optimize && src.pathMinExists)) {
            return compile(result, src.dirname, dest.basename, src.type);
          }
          return result;
        })
        .then(result => {
          if (shouldPostProcess(dest.type) && !(optimize && src.pathMinExists)) {
            return postProcess(result, dest.type);
          }
          return result;
        })
        .then(result => {
          if (optimize && shouldMinify(dest.type) && !src.pathMinExists) {
            return minify(result, dest.type);
          }
          return result;
        })
        .then(result => {
          if (optimize && shouldConcat(dest.type)) {
            return {str: result, ext: dest.extnameMin, key};
          }
          return fs.outputFile(dest.path, result);
        });
    }

    accumulator.push(promise);

    return accumulator;
  }

  function concatMapping(accumulator, file) {
    if (file) accumulator[file.key] = concat(file.str, file.ext, accumulator[file.key]);
    return accumulator;
  }

  function concat(file, ext, obj) {
    return {ext: _.get(obj, 'ext', ext), value: _.get(obj, 'value', '') + '\n' + file};
  }

  function shouldCompile(type) {
    return ['sass', 'scss', 'less', 'coffee'].includes(type);
  }

  function shouldPostProcess(type) {
    return ['css'].includes(type);
  }

  function shouldMinify(type) {
    return ['css', 'js'].includes(type);
  }

  function shouldConcat(type) {
    return shouldMinify(type);
  }

  function compile(src, dirname, destBasename, type) {
    if (['sass', 'scss'].includes(type)) {
      return promisify(sass.render)({data: src, includePaths: [dirname]})
        .then(result => result.css.toString());
    }
    if (type === 'less') {
      return less.render(src, {paths: [dirname]}).then(result => result.css);
    }
    if (type === 'coffee') {
      return coffee.compile(src, {sourceMap: true}).js;
    }
  }

  function postProcess(src, type) {
    if (type === 'css') {
      return postcss([cssnext({add: false, browsers: []})]).process(src)
        .then(result => postcss([cssnext]).process(result.css))
        .then(result => result.css);
    }
  }

  function minify(src, type) {
    if (type === 'css') return csso.minify(src).css;
    if (type === 'js') return uglifyjs.minify(src, {fromString: true}).code;
  }
}
