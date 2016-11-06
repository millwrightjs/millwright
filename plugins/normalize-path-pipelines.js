const _ = require('lodash');

module.exports = group => _.assign(group, {files: _.map(group.files, normalize)});

function normalize(pathObj) {
  const jsOrCss = ['css', 'js'].includes(pathObj.type);
  const logic = {
    shouldTranspile: !pathObj.isMinified && jsOrCss,
    shouldMinify: !pathObj.isMinified && jsOrCss,
    jsOrCss
  };
  return _.assign(pathObj, logic);
}
