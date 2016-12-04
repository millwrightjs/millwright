const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const {stripIgnoredBasePath} = require('../utils/util');

module.exports = getSource;

function getSource() {
  const srcFiles = fs.walkSync(config.srcDir);
  const templatePaths = srcFiles.filter(file => path.extname(file) === '.mustache');
  const templateDataPaths = templatePaths.reduce((acc, file) => {
    const templateDataPath = changeExt(file, '.mustache', '.json');
    return srcFiles.includes(templateDataPath) ? acc.concat(templateDataPath) : acc;
  }, []);

  const pageTemplates = templatePaths.filter(file => {
    return path.basename(file) !== 'wrapper.mustache';
  });

  return pageTemplates.map(normalize);

  function normalize(templatePath) {
    const srcStripped = stripIgnoredBasePath(templatePath, config.templateIgnoredBasePaths);
    const result = {
      src: templatePath,
      dest: path.join(config.destBase, changeExt(srcStripped, '.mustache', '.html'))
    };

    const templateDataPath = changeExt(templatePath, '.mustache', '.json');
    if (templateDataPaths.includes(templateDataPath)) {
      result.data = templateDataPath;
    }

    let wrapperDirCheck = templatePath;
    while (wrapperDirCheck !== '.') {
      wrapperDirCheck = path.dirname(wrapperDirCheck);
      const wrapperPath = path.join(wrapperDirCheck, 'wrapper.mustache');
      if (templatePaths.includes(wrapperPath)) {
        result.wrapper = wrapperPath;
        wrapperDirCheck = '.';
      }
    }

    const wrapperDataPath = changeExt(result.wrapper, '.mustache', '.json');
    if (templateDataPaths.includes(wrapperDataPath)) {
      result.wrapperData = wrapperDataPath;
    }

    return result;
  }

  function changeExt(file, fromExt, toExt) {
    return path.join(path.dirname(file), path.basename(file, fromExt) + toExt);
  }
}
