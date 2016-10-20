const path = require('path');
const _ = require('lodash');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');

module.exports = function compile(file) {
  const compiled = compilers[file.type + 'C'](file);
  return compiled.then(result => _.assign(file, result));
};

const compilers = {cssC};

function cssC(file) {
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
