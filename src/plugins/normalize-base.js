const path = require('path');
const config = require('../config');
const {stripIgnoredBasePath} = require('../utils/util');

module.exports = normalizeBase;

function normalizeBase(src) {
  const normalized = path.parse(src);
  normalized.src = src;
  normalized.srcResolved = path.resolve(src);
  normalized.dirResolved = path.dirname(normalized.srcResolved);
  normalized.srcStripped = stripIgnoredBasePath(src, config.assetIgnoredBasePaths);

  return normalized;
}
