const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const {changeExt} = require('../utils/util');

module.exports = getTemplatePaths;

function getTemplatePaths() {
  const srcFiles = fs.walkSync(config.srcDir);
  const templatePaths = srcFiles.filter(file => path.extname(file) === '.mustache');
  const templateDataPaths = templatePaths.reduce((acc, templatePath) => {
    const templateDataPath = changeExt(templatePath, '.mustache', '.json');
    return srcFiles.includes(templateDataPath) ? acc.concat(templateDataPath) : acc;
  }, []);
  return {templatePaths, templateDataPaths};
}
