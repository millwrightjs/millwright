const _ = require('lodash');
const pathExists = require('path-exists');

module.exports = whicheverExists;

function whicheverExists(...paths) {
  const result = _.find([...paths], pathName => pathExists.sync(pathName));
  return result;
}
