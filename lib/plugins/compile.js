const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const sass = require('node-sass');
const less = require('less');
const stylus = require('stylus');
const coffee = require('coffee-script');

module.exports = function compile(file) {
  const compiled = compilers[file.srcType + 'C'](file);
  return compiled.then(result => _.assign(file, result));
};

const compilers = {sassC, lessC, stylusC, coffeeC};

function sassC(file) {
  return promisify(sass.render)({
    data: file.content,
    file: file.srcPath,
    includePaths: [file.srcDir],
    sourceMap: true,
    outFile: file.basename,
    omitSourceMapUrl: true
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map.toString(),
    mapImports: result.stats.includedFiles
  }));
}

function lessC(file) {
  return less.render(file.content, {
    filename: file.srcPath,
    sourceMap: {},
    paths: [file.srcDir]
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map,
    mapImports: result.imports
  }));
}

function stylusC(file) {
  let result;
  const style = stylus(file.content)
    .set('filename', file.srcPath)
    .set('sourcemap', {comment: false})
    .define('url', stylus.resolver());

  style.render((err, css) => {
    result = {
      content: css,
      map: style.sourcemap,
      mapImports: style.deps()
    };
  });

  return Promise.resolve(result);
}

function coffeeC(file) {
  const opts = {
    sourceMap: true,
    filename: file.srcPath,
    sourceFiles: [file.srcPath]
  };
  const compiled = coffee.compile(file.content, opts);
  const result = {
    content: compiled.js,
    map: compiled.v3SourceMap
  };
  return Promise.resolve(result);
}
