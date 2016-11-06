const _ = require('lodash');

module.exports = group => _.assign(group, {files: _.map(group.files, normalize)});

function normalize(pathObj) {
  const logic = {
    shouldTranspile: !pathObj.isMinified && ['css', 'js'].includes(pathObj.type),
    shouldMinify: !pathObj.isMinified && ['css', 'js'].includes(pathObj.type)
  }
  return _.assign(pathObj, logic);
}
