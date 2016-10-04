const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify('fs-extra');
const pathExists = require('path-exists');
const sass = require('node-sass');
const less = require('less');
const stylus = require('stylus');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');
const coffee = require('coffee-script');
const csso = require('csso');
const uglifyjs = require('uglify-js');
const Concat = require('concat-with-sourcemaps');

module.exports = function(group) {
  // Make a chainable async map function, add to lodash as a mixin.
  return _(group)
    .map(asset => _.partialRight(fs.readFile, 'utf8')
    .map(asset => shouldCompile(asset) ? compile(asset) : asset)
    .value();
}

function processMapping(accumulator, mapping) {
  const {dest, src, key} = mapping;
  let promise;

  // Files that have minified versions don't need their sources compiled/processed. Do they?
  const skipForOptimize = optimize && src.pathMinExists;
  const shouldCompile = shouldCompileType(src.type) && !skipForOptimize;
  const shouldPostProcess = shouldPostProcessType(src.type) && !src.isMinified && !skipForOptimize;
  const shouldMinify = optimize && shouldMinifyType(dest.type) && !src.pathMinExists;
  const shouldConcat = optimize && shouldConcatType(dest.type);

  if (src.isDirectory || (!shouldCompile && !shouldPostProcess && !shouldMinify && !shouldConcat)) {
    promise = fs.copy(src.pathMinExists ? src.pathMin : src.path, dest.path, {dereference: true});
  }

  else {
    promise = fs.readFile(src.path, 'utf8')
      .then(result => ({file: result}))
      .then(result => {
        if (shouldCompile) {
          result = compile(
            result.file, src.path, src.dirname, dest.dirname, src.basename, dest.basename, src.type, dest.type);
        }
        return result;
      })
      .then(result => {
        if (shouldPostProcess) {
          result = postProcess(
            result.file, src.dirname, dest.dirname, src.basename, dest.basename, dest.type, dest.path, result.sourcemap);
        }
        return result;
      })
      .then(result => {
        if (shouldMinify) {
          result = minify(result.file, dest.path, dest.type, result.sourcemap)
            .then(output => ({file: output.file, sourcemap: output.sourcemap}));
        }
        return result;
      })
      .then(result => {
        if (shouldConcat) {
          return {
            src: path.relative('src', src.path),
            destFile: path.join(key + dest.extnameMin),
            file: result.file,
            sourcemap: result.sourcemap,
            destType: dest.type,
            destDirname: dest.dirname,
            destBasename: dest.basename,
            key
          };
        }
        return fs.outputFile(dest.path, result.getFileWithSourcemapUrl());
      });
  }

  accumulator.push(promise);

  return accumulator;
}

function shouldCompile(asset) {
  return !asset.src.pathMinExists && ['sass', 'scss', 'less', 'styl', 'coffee'].includes(asset.src.type);
}

function shouldPostProcessType(type) {
  return ['css'].includes(type);
}

function shouldMinifyType(type) {
  return ['css', 'js'].includes(type);
}

function shouldConcatType(type) {
  return shouldMinifyType(type);
}
}
