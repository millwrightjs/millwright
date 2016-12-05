const path = require('path');
const config = require('../config');
const {stripIgnoredBasePath, changeExt} = require('../utils/util');
const cache = require('../utils/cache');

module.exports = normalizeTemplatePaths;

function normalizeTemplatePaths(templatePathObj) {
  const {templatePaths, templateDataPaths} = templatePathObj[0];

  return templatePaths.filter(p => path.basename(p) !== 'wrapper.mustache').map(templatePath => {
    const srcStripped = stripIgnoredBasePath(templatePath, config.templateIgnoredBasePaths);
    const result = {
      src: templatePath,
      dest: path.join(config.destBase, changeExt(srcStripped, '.mustache', '.html')),
    };

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
  });
}
