const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const mustache = require('mustache');

const partialFileNames = _.attemptSilent(fs.readdirSync, config.partialsDir);
const partials = _.reduce(partialFileNames, (obj, partialFileName) => {
    const name = path.basename(partialFileName, '.mustache');
    const partialPath = path.join(partialsDir, partialFileName);
    obj[name] = fs.readFileSync(partialPath).toString();
    return obj;
  }, {});

const cache = {};

module.exports = static;

function static(template) {
  cacheWrapper(template);
  const wrapper = cache[template.wrapper];
  const wrapperData = cache[template.wrapperData];

  const page = fs.readFileSync(template.src, 'utf8');
  const templateData = _.attemptSilent(fs.readJsonSync, template.data) || {};
  const data = _.assign({}, wrapperData, templateData);

  if (_.has(wrapperData, 'files') && _.has(templateData, 'files')) {
    data.files = _.mergeWith({}, wrapperData.files, templateData.files, (dest, src) => {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  const result = mustache.render(wrapper, data, _.assign({}, partials, {page}));
  fs.outputFileSync(template.dest, result);
}

function cacheWrapper(template) {
  if (template.wrapper && !cache[template.wrapper]) {
    cache[template.wrapper] = _.attemptSilent(fs.readFileSync, template.wrapper, 'utf8');
  }
  if (template.wrapperData && !cache[template.wrapperData]) {
    cache[template.wrapperData] = _.attemptSilent(fs.readJsonSync, template.wrapperData, 'utf8');
  }
}
