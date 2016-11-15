const _ = require('../lib/lodash-extended');
const fs = require('fs-extra');
const path = require('path');
const handlebars = require('handlebars');
const {whicheverExists} = require('../lib/util');

module.exports = function(viewData) {
  const wrapperTemplatePath = whicheverExists('src/wrapper.hbs', 'src/page.hbs');

  if (!wrapperTemplatePath) {
    return;
  }

  const templatesDir = 'src/pages';
  const partialsDir = 'src/partials';
  const outputDir = 'dest';

  const wrapperTemplate = fs.readFileSync(wrapperTemplatePath).toString();
  const templateFileNames = fs.readdirSync(templatesDir);
  const partialFileNames = _.attemptSilent(fs.readdirSync, partialsDir);

  registerPartials();

  const pages = getPages();

  pages.forEach(page => fs.outputFileSync(path.join(outputDir, page.name), page.html));

  function registerPartials() {
    _.forEach(partialFileNames, partialFileName => {
      const name = path.basename(partialFileName, '.hbs');
      const partialPath = path.join(partialsDir, partialFileName);
      const partial = fs.readFileSync(partialPath).toString();
      handlebars.registerPartial(name, partial);
    });
  }

  function getPages() {
    return templateFileNames.map(templateFileName => {
      const templatePath = path.join(templatesDir, templateFileName);
      const template = fs.readFileSync(templatePath).toString();
      handlebars.registerPartial('page', template);
      const rendered = {
        name: path.basename(templateFileName, '.hbs') + '.html',
        html: handlebars.compile(wrapperTemplate)(viewData)
      };
      handlebars.unregisterPartial('page');
      return rendered;
    });
  }
}