const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const sass = require('node-sass');

module.exports = function() {
  const dependencies = fs.readJsonSync('src/dependencies.json');
  const destDir = 'dest';
  const viewData = {};

  _.forEach(dependencies, (group, name) => _.isArray(group) ? processGroup(group, name) : false);

  return viewData;

  function processGroup(group, name) {
    let destPaths = _.map(group, dependency => _.has(dependency, 'src') ? process(dependency) : null);

    viewData[name] = _.flatten(destPaths);
  }

  function process(dependency) {
    if (_.isArray(dependency.src)) {
      return _.map(dependency.src, depSrc => process({dest: dependency.dest, src: depSrc}));
    }

    const {src, dest} = dependency;
    const fileType = path.extname(src);
    const basename = path.basename(src);
    let destFileName;

    if (fileType === '.scss') {
      const css = sass.renderSync({file: src}).css.toString();
      const outputFileName = path.join(dest, path.basename(src, '.scss') + '.css');
      fs.outputFileSync(path.join(destDir, outputFileName), css);
      destFileName = outputFileName;
    } else {
      fs.copySync(src, path.join(destDir, dest, basename));
      destFileName = path.join(dest, basename);
    }

    return destFileName;
  }
}
