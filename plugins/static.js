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

  const page = fs.readFileSync(template.src, 'utf8');
  const templateData = cache.get(changeExt(template.src, '.json')) || {};

  wrapperData.files = toWebPaths(wrapperData.files);
  templateData.files = toWebPaths(templateData.files);

  const data = _.assign({}, wrapperData, templateData);

  if (_.has(wrapperData, 'files') && _.has(templateData, 'files')) {
    data.files = _.mergeWith({}, wrapperData.files, templateData.files, (dest, src) => {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  const pagePartials = wrapper ? _.assign({}, partials, {page}) : partials;

  const result = mustache.render(wrapper || page, data, pagePartials);

  fs.outputFileSync(template.dest, result);
}

function toWebPaths (assets) {
  return _.chain(assets)
    .reduce((acc, asset) => {
      acc[asset.groupKey] = acc[asset.groupKey] || [];
      acc[asset.groupKey].push(asset[process.env.task === 'build' ? 'groupWebPath' : 'webPath']);
      return acc;
    }, {})
    .mapValues(_.uniq)
    .value();
}
