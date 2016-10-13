const _ = require('lodash');

module.exports = function getCompiledType(type) {
  // Accept an object with a 'type' property, or else assume a string
  type = _.get(type, 'type') || type;

  const typeMap = {
    css: ['sass', 'less', 'stylus'],
    js: ['coffee']
  }
  return _.findKey(typeMap, types => _.includes(types, type));
}
