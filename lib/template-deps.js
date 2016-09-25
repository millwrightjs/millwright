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
              result, src.path, src.dirname, dest.dirname, src.basename, dest.basename, src.type, dest.type);
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

  function compile(src, srcPath, srcDirname, destDirname, srcBasename, destBasename, srcType, destType) {
    if (['sass', 'scss'].includes(srcType)) {
      return promisify(sass.render)({
        data: src,
        file: srcPath,
        includePaths: [srcDirname],
        sourceMap: true,
        outFile: destBasename,
        omitSourceMapUrl: true
      })
      .then(result => {
        const {css, map, stats} = result;
        return sourcemap(src, css.toString(), map.toString(), destType, stats.includedFiles);
      });
    }
    if (srcType === 'less') {
      return less.render(src, {
        filename: srcPath,
        sourceMap: {},
        paths: [srcDirname]
      })
      .then(result => {
        return sourcemap(src, result.css, result.map, destType, result.imports);
      });
    }
    if (srcType === 'styl') {
      let result;
      const style = stylus(src)
        .set('filename', srcPath)
        .set('sourcemap', {comment: false})
        .define('url', stylus.resolver());

      style.render((err, css) => {
        result = sourcemap(src, css, style.sourcemap, destType, style.deps());
      });

      return result;
    }
    if (srcType === 'coffee') {
      const result = coffee.compile(src, {sourceMap: true, filename: srcPath, sourceFiles: [srcPath]});
      return sourcemap(src, result.js, result.v3SourceMap, destType);
    }

    function sourcemap(src, str, map, destType, includes) {
      copySource(src, {includes});
      outputSourcemap(map);
      return appendSourcemapUrl(str, destType);
    }

    function copySource(src, opts) {
      fs.outputFileSync(path.join('dest', path.relative('src', srcDirname), srcBasename), src);
      if (opts.includes) {
        opts.includes.forEach(include => {
          fs.copySync(include, path.join('dest', path.relative('src', include)));
        });
      }
    }

    function outputSourcemap(sourcemap) {
      const parsed = _.isString(sourcemap) ? JSON.parse(sourcemap) : sourcemap;
      const rebuiltSourcemap = {
        version: parsed.version,
        mappings: parsed.mappings,
        names: parsed.names
      };
      if (!_.isEmpty(parsed.sources)) {
        rebuiltSourcemap.sources = parsed.sources.map(source => path.relative('src', source));
      }
      fs.outputFileSync(path.join('dest', destBasename + '.map'), JSON.stringify(rebuiltSourcemap));
    }

    function appendSourcemapUrl(src, destType) {
      const prepend = destType === 'css' ? '/*' : '//';
      const append = destType === 'css' ? '*/' : null;
      const url = path.join(path.relative(path.join('dest', destDirname), 'dest'), destBasename + '.map');
      return src + '\n' + prepend + '# sourceMappingURL=' + url + ' ' +
        (append || '');
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
