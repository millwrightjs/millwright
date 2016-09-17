const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify('fs-extra');
const sass = require('node-sass');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  return Promise.all(mappings.reduce(processMapping, []))
    .then(result => result.reduce(concatMapping, {}))
    .then(result => {
      _.forEach(result, (file, key) => {
        fs.outputFileSync(path.join('dest', key + file.ext), file.value);
      });
    });

  function processMapping(accumulator, mapping) {
    const {dest, src, key} = mapping;
    let promise;

    if (optimize && shouldOptimize(dest.type) && !src.pathMinExists) {
      promise = transform(src.path, src.type, dest.type)
        .then(result => minify(result || src.path, dest.type, !!result))
        .then(result => ({str: result, ext: dest.extnameMin, key}));
    }

    else if (optimize && shouldOptimize(dest.type) && src.pathMinExists) {
      promise =  fs.readFile(src.pathMin, 'utf8')
        .then(result => ({str: result, ext: dest.extnameMin, key}));
    }

    else {
      promise = transform(src.path, src.type, dest.type)
        .then(result => output(result, src.path, dest.path), null);
    }

    accumulator.push(promise);

    return accumulator;
  }

  function concatMapping(accumulator, file) {
    if (file) accumulator[file.key] = concat(file.str, file.ext, accumulator[file.key]);
    return accumulator;
  }

  function transform(src, type, destType) {
    return compile(src, type).then(result => postProcess(result || src, destType, !!result));
  }

  function output(file, src, dest) {
    if (file) return fs.outputFile(dest, file);
    return fs.copy(src, dest, {dereference: true});
  }

  function concat(file, ext, obj) {
    return {ext: _.get(obj, 'ext', ext), value: _.get(obj, 'value', '') + '\n' + file};
  }

  function shouldCompile(type) {
    return !!compilesTo(type);
  }

  function shouldOptimize(type) {
    return shouldMinify(type);
  }

  function shouldMinify(type) {
    return _.includes(['js', 'css'], type);
  }

  function shouldPostProcess(type) {
    return _.includes(['css'], type);
  }

  function compilesTo(type) {
    return {sass: 'css', scss: 'css'}[type];
  }

  function compile(targetPath, type) {
    if (!shouldCompile(type)) return Promise.resolve();
    if (_.includes(['sass', 'scss'], type)) {
      return promisify(sass.render)({file: targetPath}).then(result => result.css.toString());
    }
  }

  function postProcess(src, type, fromString) {
    if (!shouldPostProcess(type)) return Promise.resolve();
    if (!fromString) {
      return fs.readFile(src, 'utf8').then(process);
    }
    return process(src);

    function process(src) {
      if (type === 'css') {
        return postcss([cssnext({add: false, browsers: []})]).process(src)
          .then(result => postcss([cssnext]).process(result.css))
          .then(result => result.css);
      }
    }
  }

  function minify(src, type, fromString) {
    if (!shouldMinify(type)) return Promise.resolve();
    if (!fromString) {
      return fs.readFile(src, 'utf8').then(process);
    }
    return promisify(process)(src);

    function process(src) {
      if (type === 'css') return csso.minify(src).css;
      if (type === 'js') return uglifyjs.minify(src, {fromString: true}).code;
    }
  }
}
