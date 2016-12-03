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

function pages(assetPaths) {
  const {wrapperPath, pagesDir, partialsDir} = config;

  const pagesDirs = _(fs.walkSync(pagesDir)).map(path.dirname).uniq().pull(path.dirname(pagesDir)).value();
  const wrapperTemplate = fs.readFileSync(wrapperPath, 'utf8');
  const partialFileNames = _.attemptSilent(fs.readdirSync, partialsDir);
  const wrapperData = fs.readJsonSync(config.wrapperDataPath);
  wrapperData.files = assetPaths;

  pagesDirs.forEach(dir => {
    const outputDir = path.join(config.destBase, path.relative(pagesDir, dir));
    const templateFileNames = fs.readdirSync(dir)
      .filter(entity => fs.statSync(path.join(dir, entity)).isFile());

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
        const templatePath = path.join(dir, templateFileName);
        const templateFileNameStripped = path.basename(templateFileName, '.mustache');
        const template = fs.readFileSync(templatePath, 'utf8');
        const pageViewDataPath = path.join(dir, templateFileNameStripped + '.json');
        const pageViewData = _.attemptSilent(fs.readJsonSync, pageViewDataPath);
        const viewData = pageViewData ? _.assign({}, wrapperData, pageViewData) : wrapperData;

        if (_.get(pageViewData, 'files')) {
          viewData.files = _.mergeWith({}, wrapperData.files, pageViewData.files, (dest, src) => {
            return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
          });
        }

        return {
          name: templateFileNameStripped + '.html',
          html: mustache.render(wrapperTemplate, viewData, _.assign(partials, {page: template}))
        };
      });
    }
  });
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
