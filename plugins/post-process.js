const path = require('path');
const _ = require('lodash');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const babel = require('babel-core');

module.exports = function postProcess(file) {
  const compiled = compilers[file.type](file);
  return compiled.then(result => _.assign(file, result));
};

const compilers = {css, js};

function css(file) {
  return postcss([cssnext])
    .process(file.content, {
      from: file.srcPath,
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

function js(file) {
  const presets = arr => arr.map(name => path.join(__dirname, '../node_modules/babel-preset-' + name));
  const opts = {presets: presets(['es2015']), compact: false}
  const transformed = babel.transform(file.content, opts);
  const result = {
    content: transformed.code,
    map: transformed.map
  };
  return Promise.resolve(result);
}
