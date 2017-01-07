const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const mustache = require('mustache');
const {changeExt} = require('../utils/util');
const cache = require('../utils/cache');

module.exports = staticGen;

mustache.tags = ['{[{', '}]}'];

const partialFileNames = _.attemptSilent(fs.readdirSync, config.partialsDir);
const partials = _.reduce(partialFileNames, (obj, partialFileName) => {
  const name = path.basename(partialFileName, '.mustache');
  const partialPath = path.join(config.partialsDir, partialFileName);
  obj[name] = fs.readFileSync(partialPath).toString();
  return obj;
}, {});

function staticGen(file) {
  const {src, data: dataPath, wrapperData: wrapperDataPath} = file;
  const wrapper = _.has(file, 'wrapper') ? fs.readFileSync(file.wrapper, 'utf8') : '';
  const page = fs.readFileSync(src, 'utf8');

  const dataRef = cache.get('files', dataPath);
  const data = _.get(dataRef, 'content');
  const wrapperDataRef = cache.get('files', wrapperDataPath);
  const wrapperData = _.get(wrapperDataRef, 'content');
  const templateData = _.assign({}, wrapperData, data);

  if (_.has(wrapperData, 'assets') && _.has(data, 'assets')) {
    templateData.assets = _.mergeWith({}, wrapperData.assets, data.assets, (dest, src) => {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  const pagePartials = wrapper ? _.assign({}, partials, {page}) : partials;
  const result = mustache.render(wrapper || page, templateData, pagePartials);

  fs.outputFileSync(file.dest, result);

  if (data) {
    cache.push('deps', {
      src: dataRef.src,
      srcResolved: dataRef.srcResolved,
      consumer: file.srcResolved
    });
  }

  if (wrapperData) {
    cache.push('deps', {
      src: wrapperDataRef.src,
      srcResolved: wrapperDataRef.srcResolved,
      consumer: file.srcResolved
    });
  }

  if (wrapper) {
    const wrapperRef = cache.get('files', file.wrapper);
    cache.push('deps', {
      src: wrapperRef.src,
      srcResolved: wrapperRef.srcResolved,
      consumer: file.srcResolved
    });
  }

}
