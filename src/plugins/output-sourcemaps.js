const path = require('path');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs-extra'));
const _ = require('lodash');
const config = require('../config');

module.exports = function outputSourcemaps(file) {
  // Get paths
  const mapPath = path.join(config.destDir, 'sourcemaps', file.sourcemapPath);

  // Append sourceMappingURL to file
  const mapUrl = '/' + path.relative(file.dirDest, mapPath);
  const mapUrlStringBase = '# sourceMappingURL=' + mapUrl;
  const mapUrlString = file.typeDest === 'css' ? `/*${mapUrlStringBase} */` : `//${mapUrlStringBase}`;
  file.content += _.endsWith(file.content, '\n') ? mapUrlString : '\n' + mapUrlString;

  // Rebuild sourcemap for consistency, remap sources, then output
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  const rebuiltMap = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  const outputMap = fs.outputFileAsync(mapPath, rebuiltMap);

  return outputMap.then(() => file);
}
