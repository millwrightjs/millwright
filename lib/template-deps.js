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
              result, src.path, src.dirname, dest.dirname, src.basename, src.basenameStripped,
                dest.basename, src.type
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

  function compile(src, srcPath, srcDirname, destDirname, srcBasename, srcBasenameStripped,
      destBasename, type) {
    const sourcemapDirname = path.join('dest', path.relative('src', srcDirname));
    const sourceOnDestPath = path.join(sourcemapDirname, srcBasename);
    const sourcemapRelativePath = destBasename + '.map';

    if (['sass', 'scss'].includes(type)) {
      return promisify(sass.render)({
        data: src,
        includePaths: [srcDirname],
        sourceMap: true,
        outFile: srcBasenameStripped + '.css',
        omitSourceMapUrl: true
      })
      .then(result => {
        return sourcemap(src, result.css.toString(), result.map.toString(), result.stats.includedFiles);
      });
    }
    if (type === 'less') {
      return less.render(src, {
        paths: [srcDirname],
        sourceMap: {}
      })
      .then(result => {
        return sourcemap(src, result.css, result.map, result.imports);
      });
    }
    if (type === 'styl') {
      let result;
      const style = stylus(src)
        .set('filename', srcPath)
        .set('sourcemap', {comment: false})
        .define('url', stylus.resolver());

      style.render((err, css) => {
        result = sourcemap(src, css, style.sourcemap, style.deps());
      });

      return result;
    }
    if (type === 'coffee') {
      /*
      const filename = path.join(destDirname, type, srcBasename);
      const result = coffee.compile(src, {sourceMap: true, filename});
      fs.outputFileSync(path.join('dest', destBasename + '.map'), result.v3SourceMap);
      return result.js + '\n//# sourceMappingURL=' +
        path.relative(path.join(type), destBasename + '.map');
      */
     return coffee.compile(src);
    }

    function sourcemap(src, css, map, includes) {
      copySource(src, {includes});
      outputSourcemap(map);
      return appendSourcemapUrl(css);
    }

    function copySource(src, opts) {
      opts.includes.forEach(include => {
        fs.copySync(include, path.join('dest', path.relative('src', include)));
      });
      fs.outputFileSync(sourceOnDestPath, src);
    }

    function outputSourcemap(sourcemap) {
      const parsed = _.isString(sourcemap) ? JSON.parse(sourcemap) : sourcemap;
      _.pull(parsed.sources, 'stdin', 'input');
      const rebuiltSourcemap = JSON.stringify({
        version: parsed.version,
        mappings: parsed.mappings,
        sources: parsed.sources.map(source => path.relative('src', source))
      });
      fs.outputFileSync(path.join('dest', destBasename + '.map'), rebuiltSourcemap);
    }

    function appendSourcemapUrl(src) {
      return src + '\n/*# sourceMappingURL=' + sourcemapRelativePath + ' */';
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
