const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const sass = require('node-sass');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  _.forEach(mappings, _.mapper(processMapping));

  function processMapping(mapping) {
    const {dest, src} = mapping;
    let compiled, minified;

    if (shouldCompile(src.type)) {
      compiled = compile(src.path, src.type);
    }

    if (optimize && shouldMinify(dest.type) && !src.pathMinExists) {
      minified = minify(compiled || src.path, dest.type, !!compiled);
      fs.outputFileSync(dest.pathMin, minified);
      return;
    } else if (optimize && shouldMinify(dest.type)) {
      fs.copySync(src.pathMin, dest.pathMin, {dereference: true});
      return;
    }

    if (compiled) {
      fs.outputFileSync(dest.path, compiled);
      return;
    }

    fs.copySync(src.path, dest.path, {dereference: true});
  }

  function shouldCompile(type) {
    return !!compilesTo(type);
  }

  function shouldMinify(type) {
    return _.includes(['js', 'css'], type);
  }

  function compilesTo(type) {
    return {sass: 'css', scss: 'css'}[type];
  }

  function compile(targetPath, type) {
    if (_.includes(['sass', 'scss'], type)) {
      return sass.renderSync({file: targetPath}).css.toString();
    }
  }

  function minify(src, type, fromString) {
    if (!fromString) {
     src = fs.readFileSync(src, 'utf8');
    }
    if (type === 'css') {
      return csso.minify(src).css;
    }
    if (type === 'js') {
      return uglifyjs.minify(src, {fromString: true}).code;
    }
  }
}
