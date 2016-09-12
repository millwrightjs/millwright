const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const sass = require('node-sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  const concat = {}

  _.forEach(mappings, processMapping);

  if (!_.isEmpty(concat)) {
    // _.forEach(concat, (str, key) => fs.outputFileSync());
  }

  function processMapping(mapping, key) {
    const {dest, src} = mapping;
    let processed, minified;

    if (!optimize || !src.pathMinExists) {
      if (shouldCompile(src.type)) {
        processed = compile(src.path, src.type);
      }

      if (shouldPostProcess(dest.type)) {
        processed = postProcess(processed || src.path, dest.type, !!processed);
      }
    }

    if (optimize) {
      if (shouldMinify(dest.type) && !src.pathMinExists) {
        concat[key] = (concat[key] || '') + '\n' + minify(processed || src.path, dest.type, !!processed);
        return;
      } else if (shouldMinify(dest.type)) {
        concat[key] = (concat[key] || '') + '\n' + fs.readFileSync(src.pathMin, 'utf8');
        return;
      }
    }

    if (processed) {
      fs.outputFileSync(dest.path, processed);
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

  function shouldPostProcess(type) {
    return _.includes(['css'], type);
  }

  function compilesTo(type) {
    return {sass: 'css', scss: 'css'}[type];
  }

  function compile(targetPath, type) {
    if (_.includes(['sass', 'scss'], type)) {
      return sass.renderSync({file: targetPath}).css.toString();
    }
  }

  function postProcess(src, type, fromString) {
    if (!fromString) {
      src = fs.readFileSync(src, 'utf8');
    }
    if (type === 'css') {
      const clean = postcss([autoprefixer({add: false, browsers: []})]).process(src).css;
      return postcss([autoprefixer]).process(clean).css;
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
