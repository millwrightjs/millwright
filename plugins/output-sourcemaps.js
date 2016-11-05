const path = require('path');
const promisify = require('promisify-node');
const fs = promisify(require('fs-extra'));
const _ = require('lodash');
const config = require('../config');

module.exports = function outputSourcemaps(file) {
  // Get paths
  const mapsDir = path.join(config.destBase, 'sourcemaps');
  const mapPath = path.join(mapsDir, file.sourcemapPath);

  // Append sourceMappingURL to file
  const mapUrl = path.relative(file.destDir, mapPath);
  const mapUrlStringBase = '# sourceMappingURL=' + mapUrl;
  const mapUrlString = file.type === 'css' ? `/*${mapUrlStringBase} */` : `//${mapUrlStringBase}`;
  file.content += _.endsWith(file.content, '\n') ? mapUrlString : '\n' + mapUrlString;

  // Rebuild sourcemap for consistency, remap sources, then output
  const parsedMap = _.isString(file.map) ? JSON.parse(file.map) : file.map;
  const rebuiltMap = JSON.stringify(_.pick(parsedMap, 'version', 'mappings', 'names', 'sources'));
  const outputMap = fs.outputFile(mapPath, rebuiltMap);

  return outputMap.then(() => file);
}
