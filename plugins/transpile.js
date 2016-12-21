const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const _sass = require('node-sass');
const _less = require('less');
const _stylus = require('stylus');
const _coffee = require('coffee-script');
const babel = require('babel-core');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');

module.exports = function transpile(file) {
  const transpiled = transpilers[file.type](file);
  return transpiled.then(result => _.assign(file, result));
};

const transpilers = {sass, less, stylus, coffee, js, css};

function sass(file) {
  return promisify(_sass.render)({
    data: file.content,
    file: file.src,
    includePaths: [file.dir],
    sourceMap: true,
    outFile: file.name,
    omitSourceMapUrl: true
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map.toString(),
    mapImports: _.map(result.stats.includedFiles, included => path.relative(process.cwd(), included))
  }));
}

function less(file) {
  return _less.render(file.content, {
    filename: file.src,
    sourceMap: {},
    paths: [file.dir]
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map,
    mapImports: result.imports
  }));
}

function stylus(file) {
  let result;
  const style = _stylus(file.content)
    .set('filename', file.src)
    .set('sourcemap', {comment: false})
    .define('url', _stylus.resolver());

  style.render((err, css) => {
    result = {
      content: css,
      map: style.sourcemap,
      mapImports: style.deps()
    };
  });

  return Promise.resolve(result);
}

function coffee(file) {
  const opts = {
    sourceMap: true,
    filename: file.src,
    sourceFiles: [file.src]
  };
  const compiled = _coffee.compile(file.content, opts);
  const result = {
    content: compiled.js,
    map: compiled.v3SourceMap
  };
  return Promise.resolve(result);
}

function js(file) {
  const presets = arr => arr.map(name => path.join(__dirname, '../node_modules/babel-preset-' + name));
  const opts = {
    filename: file.base,
    presets: presets(['es2015']),
    sourceMaps: true,
    sourceFileName: file.src,
    ast: false,
    compact: false
  };
  const transformed = babel.transform(file.content, opts);
  const result = {
    content: transformed.code,
    map: transformed.map
  };
  return Promise.resolve(result);
}

function css(file) {
  return postcss([cssnext])
    .process(file.content, {
      from: file.src,
      map: {
        prev: file.map,
        inline: false,
        sourcesContent: false,
        annotation: false
      }
    })
    .then(result => ({
      content: result.css,
      map: result.map.toString()
    }));
}
