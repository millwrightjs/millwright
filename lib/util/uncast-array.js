const _ = require('lodash');

module.exports = uncastArray;

function uncastArray(value) {
  return _.isArray(value) && value.length === 1 ? value[0] : value;
}
