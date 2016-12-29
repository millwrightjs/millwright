const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const mustache = require('mustache');
const {changeExt} = require('../utils/util');
const cache = require('../utils/cache');

module.exports = static;

mustache.tags = ['{[{', '}]}'];

const partialFileNames = _.attemptSilent(fs.readdirSync, config.partialsDir);
const partials = _.reduce(partialFileNames, (obj, partialFileName) => {
  const name = path.basename(partialFileName, '.mustache');
  const partialPath = path.join(config.partialsDir, partialFileName);
  obj[name] = fs.readFileSync(partialPath).toString();
  return obj;
}, {});

function static(file, index, srcFiles) {
  if (file.role !== 'template') {
    return;
  }

  const {src, data: dataPath, wrapperData: wrapperDataPath} = file;
  const wrapper = _.has(file, 'wrapper') ? fs.readFileSync(file.wrapper, 'utf8') : '';
  const page = fs.readFileSync(src, 'utf8');

  const data = _.get(_.find(srcFiles, {srcResolved: dataPath}), 'content');
  const wrapperData = _.get(_.find(srcFiles, {srcResolved: wrapperDataPath}), 'content');
  const templateData = _.assign({}, wrapperData, data);

  if (_.has(wrapperData, 'files') && _.has(data, 'files')) {
    templateData.files = _.mergeWith({}, wrapperData.files, data.files, (dest, src) => {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  const pagePartials = wrapper ? _.assign({}, partials, {page}) : partials;
  const result = mustache.render(wrapper || page, templateData, pagePartials);

  fs.outputFileSync(file.dest, result);
}
