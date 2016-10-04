const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const pathExists = require('path-exists').sync;
const whicheverExists = require('./util/whichever-exists');
const getOrdinal = require('./util/get-ordinal');

const destDir = 'dest';

module.exports = function(group, key) {

}

function finalizeMapping(mapping) {
  mapping.dest.webPath = mapping.dest.path;
  mapping.dest.webPathMin = mapping.dest.pathMin;
  mapping.dest.path = path.join(destDir, mapping.dest.path);
  mapping.dest.pathMin = path.join(destDir, mapping.dest.pathMin || '');
  return mapping;
}

function getWebPaths(optimize, webPaths, mapping) {
  if (optimize && !webPaths[mapping.key] && _.includes(['js', 'css'], mapping.dest.type)) {
    webPaths[mapping.key] = mapping.key + mapping.dest.extnameMin;
  }

  if (!optimize && _.includes(['js', 'css'], mapping.dest.type)) {
    webPaths[mapping.key] = webPaths[mapping.key] || [];
    webPaths[mapping.key].push(mapping.dest.webPath);
    return webPaths;
  }

  return webPaths;
}
