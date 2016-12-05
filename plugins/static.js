const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const mustache = require('mustache');
const {changeExt} = require('../utils/util');
const cache = require('../utils/cache');

const partialFileNames = _.attemptSilent(fs.readdirSync, config.partialsDir);
const partials = _.reduce(partialFileNames, (obj, partialFileName) => {
  const name = path.basename(partialFileName, '.mustache');
  const partialPath = path.join(partialsDir, partialFileName);
  obj[name] = fs.readFileSync(partialPath).toString();
  return obj;
}, {});

module.exports = static;

function static(template) {
  const wrapper = _.has(template, 'wrapper') ? cache.get(template.wrapper) : '';
  const wrapperData = _.has(template, 'wrapperData') ? cache.get(template.wrapperData) : {};

  // We'll update cache.get to except a function as second arg to transform the file content
  // prior to caching. In this case we'll do pass in the asset normalization plugin. The resulting
  // normalized files property will be useful for both static gen and the asset pipeline.
  //
  // We'll just map to the 'webPath' value each time we access a cached json file.

  const page = fs.readFileSync(template.src, 'utf8');
  const templateData = cache.get(changeExt(template.src, '.mustache', '.json')) || {};
  const data = _.assign({}, wrapperData, templateData);

  wrapperData.files = _.mapValues(wrapperData.files, 'webPath');
  templateData.files = _.mapValues(templateData.files, 'webPath');

  if (_.has(wrapperData, 'files') && _.has(templateData, 'files')) {
    data.files = _.mergeWith({}, wrapperData.files, templateData.files, (dest, src) => {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  const result = mustache.render(wrapper, data, _.assign({}, partials, {page}));
  fs.outputFileSync(template.dest, result);
}
