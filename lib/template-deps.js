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
    .thru(optimizer(_.mapValues, checkMinified))
    .thru(optimizer(_.mapValues, concat))
    .mapValues(_.partial(finalizeMapping, optimize))
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
      const extname = _.trim(path.extname(src), '.');
      if (extname === 'js' || extname === 'css') {
        const dirname = path.dirname(src);
        const basenameStripped = _.trim(path.basename(src, extname), '.');
        mapping.isMinified = _.trim(path.extname(basenameStripped), '.') === 'min';
        mapping.withMinified = pathExists.sync(path.join(dirname, basenameStripped + '.min.' + extname));
      }
      return mapping;
    }
  }

  function finalizeMapping(optimize, fileMapping) {
    const extMap = {
      scss: 'css',
      sass: 'css'
    };

    return _.isArray(fileMapping) ? _.map(fileMapping, finalize) : finalize(fileMapping);

    function finalize(mapping) {
      let {src, dest} = mapping;
      const extnameSrc = path.extname(src).substr(1);

      // If src specifies a file name (not just directory) and dest does not, we
      // reuse the file name from src.
      if (extnameSrc && !path.extname(dest)) {
        const extnameDest = extMap[extnameSrc] || extnameSrc;
        const basenameDest = path.basename(src, extnameSrc) + extnameDest;
        dest = path.join(dest, basenameDest);
      }

      // If we're optimizing, and the file extension is js or css, add 'min'.
      if (optimize && !mapping.isMinified) {
        const extnameDest = path.extname(dest).substr(1);

        if (_.includes(['js', 'css'], extnameDest)) {
          const basenameMin = path.basename(dest, extnameDest) + 'min.' + extnameDest;
          src = mapping.withMinified ? path.join(path.dirname(src), basenameMin) : src;
          dest = path.join(path.dirname(dest), basenameMin);
        }
      }

      mapping.src = src;
      mapping.relativeDest = dest;
      mapping.dest = path.join(destDir, dest);
      return mapping;
    }
  }

  function processGroup(optimize, group) {
    _.isArray(group) ? _.forEach(group, mapping => process(mapping)) : process(mapping);

    function process(mapping) {
      const {dest, src, isMinified} = mapping;
      const fileType = path.extname(src).substr(1);

      if (_.includes(['sass', 'scss', 'js'], fileType)) {
        const result = optimize && !isMinified ? minify({src: compile(src), dest}) : compile(src);
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

  function concat(group) {
    return group;
  }

  function optimizer(processor, task) {
    return optimize ? _.partialRight(processor, task) : _.identity;
  }

  function mapToRelativeDest(group) {
    return _.isArray(group) ? _.map(group, mapping => mapping.relativeDest) : group.relativeDest;
  }
}
