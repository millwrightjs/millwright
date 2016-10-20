const _ = require('lodash');

module.exports = group => _.assign(group, {files: _.map(group.files, normalize)});

function normalize(pathObj) {
  const pipelineLogic = {
    shouldCompile: pathObj.srcType !== pathObj.type,
    shouldPostProcess: !pathObj.isMinified && pathObj.srcType === 'css',
    shouldMinify: !pathObj.isMinified && ['css', 'js'].includes(pathObj.type)
  }
  return _.assign(pathObj, pipelineLogic);
}
