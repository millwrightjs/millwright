const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const sass = require('node-sass');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  _.forEach(mappings, _.mapper(processMapping));

  function processMapping(mapping) {
    const typeMap = {
      sass: 'css',
      scss: 'css',
      js: 'js'
    };

    const {dest, src} = mapping;

    if (typeMap[src.type]) {
      const compiled = compile(src);
      let minified;
      if (optimize) {
        minified = minify(compiled, dest.type);
      }
      fs.outputFileSync(dest.path, minified || compiled);
    } else {
      fs.copySync(src.path, dest.path, {dereference: true});
    }
  }

  function compile(src) {
    if (_.includes(['sass', 'scss'], src.type)) {
      return sass.renderSync({file: src.path}).css.toString();
    }
    return fs.readFileSync(src.path).toString();
  }

  function minify(compiled, type) {
    if (type === 'css') {
      return csso.minify(compiled).css;
    }
    if (type === 'js') {
      return uglifyjs.minify(compiled, {fromString: true}).code;
    }
  }
}
