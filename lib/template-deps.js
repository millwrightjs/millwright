const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const sass = require('node-sass');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings) {

  return;

  _.forEach(normalizedMappings, _.mapper(processGroup));

  function processGroup(group) {
    const {dest, src, isMinified} = mapping;
    const fileType = path.extname(src).substr(1);

    if (_.includes(['sass', 'scss', 'js'], fileType)) {
      const result = optimize && !isMinified ? minify({src: compile(src), dest}) : compile(src);
      return fs.outputFileSync(dest, result);
    }

    return fs.copySync(src, dest, {dereference: true});
  }

  function compile(src) {
    const fileType = path.extname(src).substr(1);
    if (fileType === 'scss' || fileType === 'sass') {
      return sass.renderSync({file: src}).css.toString();
    }
    return fs.readFileSync(src).toString();
  }

  function minify(mapping) {
    const {dest, src} = mapping;
    const fileType = path.extname(dest).substr(1);
    if (fileType === 'css') {
      return csso.minify(src).css;
    }
    if (fileType === 'js') {
      return uglifyjs.minify(src, {fromString: true}).code;
    }
    return src;
  }
}
