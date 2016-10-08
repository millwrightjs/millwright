const _ = require('lodash');

module.exports = function getCompiledType(type) {
  const typeMap = {
    css: ['scss', 'sass', 'less', 'styl'],
    js: ['coffee']
  }
  return _.findKey(typeMap, types => _.includes(types, type));
}
