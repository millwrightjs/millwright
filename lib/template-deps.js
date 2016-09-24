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
    const sourcemapDirname = path.join('dest', destDirname, type);
    const sourceOnDestPath = path.join(sourcemapDirname, srcBasename);

    if (['sass', 'scss'].includes(type)) {
      return promisify(sass.render)({
        data: src,
        includePaths: [srcDirname],
        outFile: srcBasenameStripped + '.css',
        sourceMap: true,
        importer: function(url, prev, done) {
          const file = path.join(sourcemapDirname, url);
          const importPathBase = path.join(srcDirname, url);
          const importPathBaseAlt = path.join(srcDirname, path.dirname(url), '_' + path.basename(url));
          const importPath = [
            importPathBase + '.scss',
            importPathBaseAlt + '.scss',
            importPathBase,
            importPathBaseAlt,
            importPathBase + '.sass',
            importPathBaseAlt + '.sass'
          ].find(currentPath => pathExists.sync(currentPath) && fs.statSync(currentPath).isFile());

          if (importPath) {
            const file = path.join(type, path.relative(srcDirname, importPath));
            const contents = fs.readFileSync(importPath, 'utf8');
            return {file, contents};
          }
          return {};
        }
      })
      .then(result => {
        const includeSrcMapper = include => path.join(srcDirname, path.relative(type, include));
        const includeDestMapper = include => path.join('dest', include);
        copySource(src, {includes: result.stats.includedFiles, includeSrcMapper, includeDestMapper});
        fs.outputFileSync(path.join('dest', destBasename + '.map'), result.map.toString());
        return result.css.toString();
      });
    }
    if (type === 'less') {
      return less.render(src, {
        paths: [srcDirname],
        sourceMap: {
          sourceMapBasepath: srcDirname,
          sourceMapRootpath: type,
          sourceMapURL: 'less.css.map'
        }
      })
      .then(result => {
        copySource(src, {includes: result.imports});
        fs.outputFileSync(path.join('dest', destBasename + '.map'), result.map);
        return result.css;
      });
    }
    if (type === 'styl') {
      let result;
      const style = stylus(src)
        .set('filename', srcPath)
        .set('sourcemap', {});

      copySource(src, {includes: style.deps()});

      style
        .set('filename', sourceOnDestPath)
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
      /*
      const filename = path.join(destDirname, type, srcBasename);
      const result = coffee.compile(src, {sourceMap: true, filename});
      fs.outputFileSync(path.join('dest', destBasename + '.map'), result.v3SourceMap);
      return result.js + '\n//# sourceMappingURL=' +
        path.relative(path.join(type), destBasename + '.map');
      */
     return coffee.compile(src);
    }

    function copySource(src, opts) {
      let getIncludeSrc = opts.includeSrcMapper || _.identity;
      let getIncludeDest = _.defaultTo(opts.includeDestMapper, include => {
        return path.join(sourcemapDirname, path.relative(srcDirname, include));
      });
      opts.includes.forEach(include => fs.copySync(getIncludeSrc(include), getIncludeDest(include)));
      fs.outputFileSync(sourceOnDestPath, src);
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
