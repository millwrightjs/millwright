const path = require('path');
const _ = require('lodash');
const promisify = require('promisify-node');
const fs = promisify('fs-extra');
const sass = require('node-sass');
const less = require('less');
const stylus = require('stylus');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const coffee = require('coffee-script');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(mappings, optimize) {

  if (optimize) {
    return Promise.all(mappings.reduce(processMapping, []))
      .then(result => result.reduce(concatMapping, {}))
      .then(result => {
        const promises = _.map(result, (file, key) => {
          return fs.outputFile(path.join('dest', key + file.ext), file.value);
        });
        return Promise.all(promises)
      });
  }
  return Promise.all(mappings.reduce(processMapping, []));

  function processMapping(accumulator, mapping) {
    const {dest, src, key} = mapping;
    let promise;

    // Files that have minified versions don't need their sources compiled/processed. Do they?
    const noOptHasMin = !(optimize && src.pathMinExists);
    const shouldCompile = shouldCompileType(src.type) && noOptHasMin;
    const shouldPostProcess = shouldPostProcessType(src.type) && !src.isMinified && noOptHasMin;
    const shouldMinify = optimize && shouldMinifyType(dest.type) && !src.pathMinExists;
    const shouldConcat = optimize && shouldConcatType(dest.type);

    if (src.isDirectory || (!shouldCompile && !shouldPostProcess && !shouldMinify && !shouldConcat)) {
      promise = fs.copy(src.pathMinExists ? src.pathMin : src.path, dest.path, {dereference: true});
    }

    else {
      promise = fs.readFile(src.path, 'utf8')
        .then(result => {
          if (shouldCompile) {
            return compile(
              result, src.path, dest.path, src.dirname, dest.dirname, src.basename, dest.basename,
                src.type
            );
          }
          return result;
        })
        .then(result => shouldPostProcess ? postProcess(result, dest.type) : result)
        .then(result => shouldMinify ? minify(result, dest.type) : result)
        .then(result => shouldConcat ?
              {str: result, ext: dest.extnameMin, key} : fs.outputFile(dest.path, result))
    }

    accumulator.push(promise);

    return accumulator;
  }

  function concatMapping(accumulator, file) {
    if (file) accumulator[file.key] = concat(file.str, file.ext, accumulator[file.key]);
    return accumulator;
  }

  function concat(file, ext, obj) {
    return {ext: _.get(obj, 'ext', ext), value: _.get(obj, 'value', '') + '\n' + file};
  }

  function shouldCompileType(type) {
    return ['sass', 'scss', 'less', 'styl', 'coffee'].includes(type);
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

  function compile(src, srcPath, destPath, srcDirname, destDirname, srcBasename, destBasename, type) {
    if (['sass', 'scss'].includes(type)) {
      return promisify(sass.render)({data: src, includePaths: [srcDirname]})
        .then(result => result.css.toString());
    }
    if (type === 'less') {
      const sourcemapDirname = path.join('dest', destDirname, type);
      const sourcemapPath = path.join(sourcemapDirname, srcBasename);
      fs.outputFileSync(sourcemapPath, src);

      return less.render(src, {
        paths: [srcDirname],
        sourceMap: {
          sourceMapBasepath: srcDirname,
          sourceMapRootpath: type,
          sourceMapURL: 'less.css.map'
        }
      })
      .then(result => {
        result.imports.forEach(dep => {
          fs.copySync(dep, path.join(sourcemapDirname, path.relative(srcDirname, dep)));
        });
        fs.outputFileSync(path.join('dest', destBasename + '.map'), result.map);
        return result.css;
      });
    }
    if (type === 'styl') {
      let result;
      const sourcemapDirname = path.join('dest', destDirname, type);
      const sourcemapPath = path.join(sourcemapDirname, srcBasename);
      fs.outputFileSync(sourcemapPath, src);
      const style = stylus(src)
        .set('filename', srcPath)
        .set('sourcemap', {});

      style.deps().forEach(dep => {
        fs.copySync(dep, path.join(sourcemapDirname, path.relative(srcDirname, dep)));
      });

      style
        .set('filename', sourcemapPath)
        .set('dest', 'dest')
        .set('sourcemap', {})
        .define('url', stylus.resolver());

      style.render((err, css) => {
        result = css;
        fs.writeJsonSync(path.join('dest', destBasename + '.map'), style.sourcemap);
      });

      return result;
    }
    if (type === 'coffee') {
      return coffee.compile(src, {sourceMap: true}).js;
    }
  }

  function postProcess(src, type) {
    if (type === 'css') {
      return postcss([cssnext({add: false, browsers: []})]).process(src)
        .then(result => postcss([cssnext]).process(result.css))
        .then(result => result.css);
    }
  }

  function minify(src, type) {
    if (type === 'css') return csso.minify(src).css;
    if (type === 'js') return uglifyjs.minify(src, {fromString: true}).code;
  }
}
