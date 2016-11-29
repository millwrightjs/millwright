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

module.exports = function(mappings, optimize) {

  if (optimize) {
    return Promise.all(mappings.reduce(processMapping, []))
      .then(result => {
        return result.reduce(concatMapping, {});
      })
      .then(result => {
        const promises = _.map(result, (file) => {
          const content = appendSourcemapUrl(file.concat.content.toString(), file.destType, file.destFile);
          const sourcemap = outputSourcemap(file.concat.sourceMap, file.destFile);
          return Promise.all([
            fs.outputFile(path.join('dest', file.destFile), content),
            fs.outputFile(path.join('dest', file.destFile + '.map'), sourcemap)
          ]);
        });
        return Promise.all(promises)
      });
  }
  return Promise.all(mappings.reduce(processMapping, []));

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

  function concatMapping(accumulator, source) {
    if (source) {
      const {src, destFile, srcBasename, file, sourcemap, key, destType, destDirname, destBasename} = source;
      accumulator[key] = _.defaultTo(accumulator[key], {
        concat: new Concat(true, destFile, '\n'),
        destType,
        destDirname,
        destBasename,
        destFile
      });
      accumulator[key].concat.add(src, file, sourcemap);
    }
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
        const file = result.css.toString();
        return {
          file,
          getFileWithSourcemapUrl: _.partial(appendSourcemapUrl, file, destType, destDirname, destBasename),
          sourcemap: sourcemap(src, srcDirname, srcBasename, destBasename, result.map.toString(), result.stats.includedFiles),
        };
      });
    }
    if (srcType === 'less') {
      return less.render(src, {
        filename: srcPath,
        sourceMap: {},
        paths: [srcDirname]
      })
      .then(result => {
        const file = result.css.toString();
        return {
          file,
          getFileWithSourcemapUrl: _.partial(appendSourcemapUrl, file, destType, destDirname, destBasename),
          sourcemap: sourcemap(src, srcDirname, srcBasename, destBasename, result.map, result.imports),
        };
      });
    }
    if (srcType === 'styl') {
      let result;
      const style = stylus(src)
        .set('filename', srcPath)
        .set('sourcemap', {comment: false})
        .define('url', stylus.resolver());

      style.render((err, css) => {
        const file = css;
        result = {
          file,
          getFileWithSourcemapUrl: _.partial(appendSourcemapUrl, file, destType, destDirname, destBasename),
          sourcemap: sourcemap(src, srcDirname, srcBasename, destBasename, style.sourcemap, style.deps()),
        };
      });

      return result;
    }
    if (srcType === 'coffee') {
      const result = coffee.compile(src, {sourceMap: true, filename: srcPath, sourceFiles: [srcPath]});
      const file = result.js;
      return {
        file,
        getFileWithSourcemapUrl: _.partial(appendSourcemapUrl, file, destType, destDirname, destBasename),
        sourcemap: sourcemap(src, srcDirname, srcBasename, destBasename, result.v3SourceMap),
      };
    }

  }

  function postProcess(src, srcDirname, destDirname, srcBasename, destBasename, type, destPath, inputSourcemap) {
    if (type === 'css') {
      return postcss([cssnext])
        .process(src, {from: destPath, to: destPath, map: {prev: inputSourcemap, inline: false, sourcesContent: false}})
        .then(result => {
          const file = result.css;
          return {
            file,
            getFileWithSourcemapUrl: _.partial(appendSourcemapUrl, file, type, destDirname, destBasename),
            sourcemap: sourcemap(src, srcDirname, srcBasename, destBasename, result.map.toString())
          };
        });
    }
  }

  function minify(src, destPath, type, inputSourcemap) {
    if (type === 'css') {
      return postcss([cssnano()])
        .process(src, {from: destPath, to: destPath, map: {prev: inputSourcemap, inline: false, sourcesContent: false}})
        .then(result => ({file: result.css, sourcemap: result.map.toString()}));
    }
    if (type === 'js') {
      const opts = {
        fromString: true,
        outSourceMap: 'test.js.map',
      };

      if (inputSourcemap) {
        opts.inSourceMap = _.isObject(inputSourcemap) ? inputSourcemap : JSON.parse(inputSourcemap);
      }
      const result = uglifyjs.minify(src, opts);
      return Promise.resolve({file: result.code, sourcemap: result.map});
    }
  }

  function sourcemap(src, srcDirname, srcBasename, destBasename, map, includes) {
    copySource(src, srcDirname, srcBasename, {includes});
    return outputSourcemap(map, destBasename);
  }

  function copySource(src, srcDirname, srcBasename, opts) {
    fs.outputFileSync(path.join('dest', path.relative('src', srcDirname), srcBasename), src);
    if (opts.includes) {
      opts.includes.forEach(include => {
        fs.copySync(include, path.join('dest', path.relative('src', include)));
      });
    }
  }

  function outputSourcemap(sourcemap, destBasename) {
    const parsed = _.isString(sourcemap) ? JSON.parse(sourcemap) : sourcemap;
    const rebuiltSourcemap = {
      version: parsed.version,
      mappings: parsed.mappings,
      names: parsed.names
    };
    if (!_.isEmpty(parsed.sources)) {
      rebuiltSourcemap.sources = parsed.sources.map(source => {
        return source.startsWith('src') ? path.relative('src', source) : source;
      });
    }
    const output = JSON.stringify(rebuiltSourcemap);
    if (!optimize) fs.outputFileSync(path.join('dest', destBasename + '.map'), output);
    return output;
  }

  function appendSourcemapUrl(src, destType, destDirname, destBasename) {
    const prepend = destType === 'css' ? '/*' : '//';
    const append = destType === 'css' ? '*/' : null;
    let url;
    if (!destBasename) {
      url = destDirname + '.map';
    } else {
      url = path.join(path.relative(path.join('dest', destDirname), 'dest'), destBasename + '.map');
    }
    return src + '\n' + prepend + '# sourceMappingURL=' + url + ' ' + (append || '');
  }
}
