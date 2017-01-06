'use strict';

var _ = require('lodash');
var postcss = require('postcss');
var cssnano = require('cssnano');
var uglifyjs = require('uglify-js');

module.exports = function minify(file) {
  var minified = minifiers[file.typeDest](file);
  return minified.then(function (result) {
    return _.assign(file, result);
  });
};

var minifiers = { css: css, js: js };

function css(file) {
  var opts = {
    from: file.src,
    to: file.src,
    map: {
      prev: file.map,
      inline: false,
      sourcesContent: false,
      annotation: false
    }
  };

  return postcss([cssnano()]).process(file.content, opts).then(function (result) {
    return {
      content: result.css,
      map: result.map.toString()
    };
  });
}

function js(file) {
  var opts = {
    fromString: true,
    sourceMapUrl: false
  };

  if (file.map) {
    opts.inSourceMap = _.isObject(file.map) ? file.map : JSON.parse(file.map);
    opts.outSourceMap = file.destFilename + '.map';
  }

  var result = uglifyjs.minify(file.content, opts);

  return Promise.resolve({ content: result.code, map: result.map });
}