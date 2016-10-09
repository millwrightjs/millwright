const _ = require('lodash');

module.exports = function getCompiledType(type) {
  const typeMap = {
    css: ['sass', 'less', 'stylus'],
    js: ['coffee']
  }
  return _.findKey(typeMap, types => _.includes(types, type));
}
