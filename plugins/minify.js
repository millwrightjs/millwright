const _ = require('lodash');
const postcss = require('postcss');
const cssnano = require('cssnano');
const uglifyjs = require('uglify-js');

module.exports = function minify(file) {
  const minified = minifiers[file.type](file);
  return minified.then(result => _.assign(file, result));
}

const minifiers = {css, js};

function css(file) {
  const opts = {
    from: file.srcPath,
    to: file.srcPath,
    map: {
      prev: file.map,
      inline: false,
      sourcesContent: false,
      annotation: false
    }
  };

  return postcss([cssnano()])
    .process(file.content, opts)
    .then(result => ({
      content: result.css,
      map: result.map.toString()
    }));
}

function js(file) {
  const opts = {
    fromString: true,
    sourceMapUrl: false
  };

  if (file.map) {
    opts.inSourceMap = _.isObject(file.map) ? file.map : JSON.parse(file.map);
    opts.outSourceMap = file.destFilename + '.map';
  }

  const result = uglifyjs.minify(file.content, opts);

  return Promise.resolve({content: result.code, map: result.map});
}
