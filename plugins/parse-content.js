const _ = require('lodash');
const fs = require('fs-extra');
const marked = require('marked');
const moment = require('moment');

module.exports = parseEntries;

function parseEntries(entries, calledRecursively) {
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
