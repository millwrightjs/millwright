const path = require('path');
const _ = require('./util/lodash-extended');
const fs = require('fs-extra');
const whicheverExists = require('./util/whichever-exists');
const objectifyMapping = require('./util/objectify-mapping');

module.exports = function() {
  const mappingsFileName = whicheverExists('src/wrapper.json', 'src/page.json');
  const mappings = fs.readJsonSync(mappingsFileName).files;
  const destDir = 'dest';
  const normalizedMappings = _(mappings)
    .mapValues(_.mapper(normalizeMapping))
    .mapValues(_.mapper(objectifyMapping))
    .mapValues(_.mapper(finalizeMapping))
    .value();

  return normalizedMappings;

  function normalizeMapping(mapping) {
    if (_.isString(mapping)) {
      return {dest: '', src: mapping};
    } else if (_.isObject(mapping) && _.isArray(mapping.src)) {
      return _.map(mapping.src, src => ({dest: mapping.dest || '', src}));
    } else if (_.isObject(mapping)) {
      return {dest: mapping.dest || '', src: mapping.src};
    }
  }

  function finalizeMapping(mapping) {
    mapping.dest.webPath = mapping.dest.path;
    mapping.dest.path = path.join(destDir, mapping.dest.path);
    return mapping;
  }
}
