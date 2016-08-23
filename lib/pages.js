const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');
const attempt = require('./util/attempt');
const whicheverExists = require('./util/whichever-exists');

module.exports = function(viewData) {
  const wrapperTemplatePath = whicheverExists('src/wrapper.mustache', 'src/page.mustache');

  if (!wrapperTemplatePath) {
    return;
  }

  const templatesDir = 'src/pages';
  const partialsDir = 'src/partials';
  const outputDir = 'dest';

  const wrapperTemplate = fs.readFileSync(wrapperTemplatePath).toString();
  const templateFileNames = fs.readdirSync(templatesDir);
  const partialFileNames = attempt(fs.readdirSync, partialsDir);

  const partials = getPartials();
  const pages = getPages();

  pages.forEach(page => fs.outputFileSync(path.join(outputDir, page.name), page.html));

  function getPartials() {
    if (partialFileNames) {
      return partialFileNames.reduce((obj, partialFileName) => {
        const name = path.basename(partialFileName, '.mustache');
        const partialPath = path.join(partialsDir, partialFileName);
        obj[name] = fs.readFileSync(partialPath).toString();
        return obj;
      }, {});
    }
  }

  function getPages() {
    return templateFileNames.map(templateFileName => {
      const templatePath = path.join(templatesDir, templateFileName);
      const template = fs.readFileSync(templatePath).toString();
      return {
        name: path.basename(templateFileName, '.mustache') + '.html',
        html: mustache.render(wrapperTemplate, viewData, _.assign(partials, {page: template}))
      };
    });
  }
}