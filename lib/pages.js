const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const mustache = require('mustache');

module.exports = function(viewData) {
  const wrapperTemplatePath = 'src/layout.mustache';
  const templatesDir = 'src/pages';
  const partialsDir = 'src/partials';
  const outputDir = 'dest';

  const wrapperTemplate = fs.readFileSync(wrapperTemplatePath).toString();
  const templateFileNames = fs.readdirSync(templatesDir);
  const partialFileNames = fs.readdirSync(partialsDir);

  const partials = partialFileNames.reduce((obj, partialFileName) => {
    const name = path.basename(partialFileName, '.mustache');
    const partialPath = path.join(partialsDir, partialFileName);
    obj[name] = fs.readFileSync(partialPath).toString();
    return obj;
  }, {});

  const pages = templateFileNames.map(templateFileName => {
    const templatePath = path.join(templatesDir, templateFileName);
    const template = fs.readFileSync(templatePath).toString();
    return {
      name: path.basename(templateFileName, '.mustache') + '.html',
      html: mustache.render(wrapperTemplate, viewData, _.assign(partials, {page: template}))
    };
  });

  pages.forEach(page => fs.outputFileSync(path.join(outputDir, page.name), page.html));
}