const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const contentful = require('contentful');
const marked = require('marked');
const moment = require('moment');
const mustache = require('mustache');

module.exports = static;

function static(watchFiles, files) {
  const views = getViews(config.contentful, files);
  return _.isPromise(views) ? views.then(() => watchFiles) : watchFiles;
}

function getViews(keys, assetPaths) {
  return keys ? getContent(keys, assetPaths) : pages(assetPaths);
}

function getContent(keys, assetPaths) {
  return contentful.createClient(keys).getEntries().then(entries => {
    return pages(_.assign(assetPaths, parseContent(entries.items, false)));
  });
}

function pages(viewData) {
  const {wrapperPath, pagesDir, partialsDir} = config;
  const outputDir = config.destBase;

  const wrapperTemplate = fs.readFileSync(wrapperPath).toString();
  const templateFileNames = fs.readdirSync(pagesDir);
  const partialFileNames = _.attemptSilent(fs.readdirSync, partialsDir);

  const partials = getPartials();
  const pages = getPages();

  pages.forEach(page => fs.outputFileSync(path.join(outputDir, page.name), page.html));

  function getPartials() {
    return _.reduce(partialFileNames, (obj, partialFileName) => {
      const name = path.basename(partialFileName, '.mustache');
      const partialPath = path.join(partialsDir, partialFileName);
      obj[name] = fs.readFileSync(partialPath).toString();
      return obj;
    }, {});
  }

  function getPages() {
    return templateFileNames.map(templateFileName => {
      const templatePath = path.join(pagesDir, templateFileName);
      const template = fs.readFileSync(templatePath).toString();
      return {
        name: path.basename(templateFileName, '.mustache') + '.html',
        html: mustache.render(wrapperTemplate, viewData, _.assign(partials, {page: template}))
      };
    });
  }
}

function parseContent(entries, calledRecursively) {
  const content = calledRecursively ? [] : {};
  _.forEach(entries, entry => {
    let contentArray;
    const parsedEntry = parseEntry(entry);

    if (calledRecursively) {
      contentArray = content;
    } else {
      const contentTypeId = entry.sys.contentType.sys.id;
      contentArray = content[contentTypeId] = content[contentTypeId] || [];
    }

    contentArray.push(parsedEntry);
  });

  return content;
}

function parseEntry(entry) {
  const fields = _.mapValues(entry.fields, val => {
    return parseNestedEntries(val) || parseFile(val) || parseDateTime(val) || val;
  });
  return _.forIn(fields, parseMarkdown);
}

function parseNestedEntries(val) {
  return _.isArray(val) ? parseEntries(val, true) : false;
}

function parseFile(val) {
  return _.isObject(val) ? {url: val.fields.file.url, description: val.fields.description} : false;
}

function parseDateTime(val) {
  const momentizedVal = moment(val, 'YYYY-MM-DDTHH:mm', true);
  return momentizedVal.isValid() ? momentizedVal.format('MMMM Do YYYY, h:mm A') : false;
}

function parseMarkdown(val, key, obj) {
  if (_.isString(val)) {
    obj[key + 'Html'] = marked(val);
  }
}
