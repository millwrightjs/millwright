'use strict';

var path = require('path');
var _ = require('lodash');
var promisify = require('promisify-node');
var _sass = require('node-sass');
var _less = require('less');
var _stylus = require('stylus');
var _coffee = require('coffee-script');
var babel = require('babel-core');
var postcss = require('postcss');
var cssnext = require('postcss-cssnext');

module.exports = function transpile(file) {
  var transpiled = transpilers[file.type](file);
  return transpiled.then(function (result) {
    return _.assign(file, result);
  });
};

var transpilers = { sass: sass, less: less, stylus: stylus, coffee: coffee, js: js, css: css };

function sass(file) {
  return promisify(_sass.render)({
    data: file.content,
    file: file.src,
    includePaths: [file.dir],
    sourceMap: true,
    outFile: file.name,
    omitSourceMapUrl: true
  }).then(function (result) {
    return {
      content: result.css.toString(),
      map: result.map.toString(),
      mapImports: _.map(result.stats.includedFiles, function (included) {
        return path.relative(process.cwd(), included);
      })
    };
  });
}

function less(file) {
  return _less.render(file.content, {
    filename: file.src,
    sourceMap: {},
    paths: [file.dir]
  }).then(function (result) {
    return {
      content: result.css.toString(),
      map: result.map,
      mapImports: result.imports
    };
  });
}

function stylus(file) {
  var result = void 0;
  var style = _stylus(file.content).set('filename', file.src).set('sourcemap', { comment: false }).define('url', _stylus.resolver());

  style.render(function (err, css) {
    result = {
      content: css,
      map: style.sourcemap,
      mapImports: style.deps()
    };
  });

  return Promise.resolve(result);
}

function coffee(file) {
  var opts = {
    sourceMap: true,
    filename: file.src,
    sourceFiles: [file.src]
  };
  var compiled = _coffee.compile(file.content, opts);
  var result = {
    content: compiled.js,
    map: compiled.v3SourceMap
  };
  return Promise.resolve(result);
}

function js(file) {
  var presets = function presets(arr) {
    return arr.map(function (name) {
      return path.join(__dirname, '../../node_modules/babel-preset-' + name);
    });
  };
  var opts = {
    filename: file.base,
    presets: presets(['es2015']),
    sourceMaps: true,
    sourceFileName: file.src,
    ast: false,
    compact: false
  };
  var transformed = babel.transform(file.content, opts);
  var result = {
    content: transformed.code,
    map: transformed.map
  };
  return Promise.resolve(result);
}

function css(file) {
  return postcss([cssnext]).process(file.content, {
    from: file.src,
    map: {
      prev: file.map,
      inline: false,
      sourcesContent: false,
      annotation: false
    }
  }).then(function (result) {
    return {
      content: result.css,
      map: result.map.toString()
    };
  });
}