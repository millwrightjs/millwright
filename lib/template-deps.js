const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const sass = require('node-sass');
const pathExists = require('path-exists');
const whicheverExists = require('./util/whichever-exists');
const csso = require('csso');
const uglifyjs = require('uglify-js');

module.exports = function(optimize) {
  const mappingsFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const mappings = fs.readJsonSync(mappingsFileName).files;
  const destDir = 'dest';
  const normalizedMappings = _(mappings)
    .mapValues(normalizeMapping)
    .thru(mappings => optimize ? _.mapValues(mappings, checkMinified) : mappings)
    .mapValues(finalizeDest)
    .value();
  const consumerMappings = _.mapValues(normalizedMappings, mapToRelativeDest);

  _.forEach(normalizedMappings, _.partial(processGroup, optimize));

  return consumerMappings;

  function normalizeMapping(mapping) {
    if (_.isString(mapping)) {
      return {dest: '', src: mapping};
    } else if (_.isArray(mapping)) {
      return _.map(mapping, normalizeMapping);
    } else if (_.isObject(mapping) && _.isArray(mapping.src)) {
      const dest = mapping.dest || '';
      return _.map(mapping.src, src => ({dest, src}));
    } else if (_.isObject(mapping)) {
      return {dest: mapping.dest || '', src: mapping.src};
    }
  }

  function checkMinified(group) {
    return _.isArray(group) ? _.map(group, mapping => check(mapping)) : check(group);

    function check(mapping) {
      const {src} = mapping;
      const extname = path.extname(src);
      const basenameStripped = path.basename(src, extname);
      const dirname = path.dirname(src);
      mapping.isMinified = path.extname(basenameStripped) === '.min';
      mapping.withMinified = pathExists.sync(path.join(dirname, basenameStripped + '.min' + extname));
      return mapping;
    }
  }

  function finalizeDest(fileMapping) {
    const extMap = {
      scss: 'css',
      sass: 'css'
    };

    return _.isArray(fileMapping) ? _.map(fileMapping, finalize) : finalize(fileMapping);

    function finalize(mapping) {
      const extnameSrc = path.extname(mapping.src).substr(1);

      if (extnameSrc && !path.extname(mapping.dest)) {
        const extnameDest = extMap[extnameSrc] || extnameSrc;
        const basenameDest = path.basename(mapping.src, extnameSrc) + extnameDest;
        mapping.dest = path.join(mapping.dest, basenameDest);
      }

      mapping.relativeDest = mapping.dest;
      mapping.dest = path.join(destDir, mapping.dest);
      return mapping;
    }
  }

  function processGroup(optimize, group) {
    _.isArray(group) ? _.forEach(group, mapping => process(mapping)) : process(mapping);

    function process(mapping) {
      const {dest, src, minified} = mapping;
      const fileType = path.extname(src).substr(1);

      if (_.includes(['sass', 'scss', 'js'], fileType)) {
        const result = optimize && !minified ? minify({src: compile(src), dest}) : compile(src);
        return fs.outputFileSync(dest, result);
      }

      return fs.copySync(src, dest, {dereference: true});
    }

    function compile(src) {
      const fileType = path.extname(src).substr(1);
      if (fileType === 'scss' || fileType === 'sass') {
        return sass.renderSync({file: src}).css.toString();
      }
      return fs.readFileSync(src).toString();
    }

    function minify(mapping) {
      const {dest, src} = mapping;
      const fileType = path.extname(dest).substr(1);
      if (fileType === 'css') {
        return csso.minify(src).css;
      }
      if (fileType === 'js') {
        return uglifyjs.minify(src, {fromString: true}).code;
      }
      return src;
    }
  }

  function mapToRelativeDest(group) {
    return _.isArray(group) ? _.map(group, mapping => mapping.relativeDest) : group.relativeDest;
  }
}
