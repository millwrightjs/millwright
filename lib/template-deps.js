const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const sass = require('node-sass');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  const concat = {}

  _.forEach(mappings, processMapping);

  _.forEach(concat, (file, key) => fs.outputFileSync(path.join('dest', key + file.ext), file.value));

  function processMapping(mapping) {
    const {dest, src, key} = mapping;
    let processed, minified;

    if (!optimize) {
      processed = compile(src.path, src.type);
      processed = postProcess(processed || src.path, dest.type, !!processed);
      output(processed, src.path, dest.path);
      return;
    }

    if (optimize && !src.pathMinExists) {
      processed = compile(src.path, src.type);
      processed = postProcess(processed || src.path, dest.type, !!processed);
      concat[key] = concat[key] || {ext: dest.extnameMin};
      concat[key].value = (concat[key].value || '') +
        '\n' + minify(processed || src.path, dest.type, !!processed);
      output(processed, src.path, dest.path);
      return;
    }

    if (optimize && src.pathMinExists) {
      concat[key] = concat[key] || {ext: dest.extnameMin};
      concat[key].value = (concat[key].value || '') + '\n' + fs.readFileSync(src.pathMin, 'utf8');
      output(processed, src.path, dest.path);
      return;
    }

  }

  function output(file, src, dest) {
    if (file) {
      fs.outputFileSync(dest, file);
    } else {
      fs.copySync(src, dest, {dereference: true});
    }
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
    if (!shouldCompile(type)) return;
    if (_.includes(['sass', 'scss'], type)) return sass.renderSync({file: targetPath}).css.toString();
  }

  function postProcess(src, type, fromString) {
    if (!shouldPostProcess(type)) return;
    if (!fromString) src = fs.readFileSync(src, 'utf8');
    if (type === 'css') {
      const clean = postcss([cssnext({add: false, browsers: []})]).process(src).css;
      return postcss([cssnext]).process(clean).css;
    }
  }

  function minify(src, type, fromString) {
    if (!shouldMinify(type)) return;
    if (!fromString) src = fs.readFileSync(src, 'utf8');
    if (type === 'css') return csso.minify(src).css;
    if (type === 'js') return uglifyjs.minify(src, {fromString: true}).code;
  }
}
