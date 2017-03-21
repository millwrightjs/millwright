const path = require('path');
const _ = require('lodash');
const bluebird = require('bluebird');
const _sass = require('node-sass');
const _less = require('less');
const _stylus = require('stylus');
const _coffee = require('coffee-script');
const babel = require('babel-core');
const {rollup} = require('rollup');
const rollupBabel = require('rollup-plugin-babel');
const rollupCommonJs = require('rollup-plugin-commonjs');
const rollupNodeResolve = require('rollup-plugin-node-resolve');
const rollupEnv = require('rollup-plugin-env');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const config = require('../config');

module.exports = function transpile(file) {
  const transpiled = transpilers[file.type](file);
  return transpiled.then(result => _.assign(file, result));
};

const transpilers = {sass, less, stylus, coffee, js, css};

function sass(file) {
  return bluebird.promisify(_sass.render)({
    data: file.content,
    file: file.src,
    includePaths: [file.dir],
    sourceMap: true,
    outFile: file.name,
    omitSourceMapUrl: true
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map.toString(),
    mapImports: _.map(result.stats.includedFiles, included => path.relative(process.cwd(), included))
  }));
}

function less(file) {
  return _less.render(file.content, {
    filename: file.src,
    sourceMap: {},
    paths: [file.dir]
  })
  .then(result => ({
    content: result.css.toString(),
    map: result.map,
    mapImports: result.imports
  }));
}

function stylus(file) {
  let result;
  const style = _stylus(file.content)
    .set('filename', file.src)
    .set('sourcemap', {comment: false})
    .define('url', _stylus.resolver());

  style.render((err, css) => {
    result = {
      content: css,
      map: style.sourcemap,
      mapImports: style.deps()
    };
  });

  return Promise.resolve(result);
}

function coffee(file) {
  const opts = {
    sourceMap: true,
    filename: file.src,
    sourceFiles: [file.src]
  };
  const compiled = _coffee.compile(file.content, opts);
  const result = {
    content: compiled.js,
    map: compiled.v3SourceMap
  };
  return Promise.resolve(result);
}

function js(file) {
  // TODO: unhack all the hacking
  const babelOpts = {
    filename: file.base,
    presets: [
      ['babel-preset-es2015'],
      'babel-preset-es2016',
      'babel-preset-es2017',
      'babel-preset-react'
    ],
    sourceMaps: true,
    sourceFileName: file.src,
    ast: false,
    compact: false
  };

  const nodeResolveOpts = {
    browser: true,
    jsnext: true,
    main: true
  };

  const commonJsOpts = {};

  if (config.modules) {
    babelOpts.presets[0][1] = {modules: false};

    if (config.namedExports) {
      Object.assign(commonJsOpts, {namedExports: config.namedExports});
    }

    const rollupOpts = {
      entry: file.src,
      plugins: [
        rollupEnv({NODE_ENV: 'production'}),
        rollupNodeResolve(nodeResolveOpts),

        // Leaving this as a working example for a react/react-router app, but
        // Rollup won't take Millwright forward because it can't consume modules
        // without configuration - manually adding namedExports is often a requirement.
        // Webpack's Node API is probably our only path forward.
        rollupCommonJs(commonJsOpts),
        rollupBabel(babelOpts)
      ]
    };

    return rollup(rollupOpts)
      .then(bundle => {
        const result = bundle.generate({
          format: config.modules === true ? 'es' : config.modules,
          sourceMap: true,
          sourceMapFile: config.srcDir
        });
        return {
          content: result.code,
          map: result.map,
          mapImports: result.map.sources
        };
      })
      .catch(err => console.log(err));
  }

  const transformed = babel.transform(file.content, babelOpts);
  const result = {
    content: transformed.code,
    map: transformed.map
  };
  return Promise.resolve(result);
}

function css(file) {
  return postcss([cssnext])
    .process(file.content, {
      from: file.src,
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
