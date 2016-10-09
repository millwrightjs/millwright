const _ = require('lodash');

module.exports = function getType(ext) {
  const typeMap = {
    js: 'js',
    css: 'css',
    scss: 'sass',
    less: 'less',
    styl: 'stylus',
    coffee: 'coffee'
  };
  return typeMap[_.trimStart(ext, '.')];
}
