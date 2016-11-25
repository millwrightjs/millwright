const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const make = require('./make');

module.exports = serve;

function serve(opts) {
  if (opts && opts.watchFiles) {
    const {watchFiles} = opts;
    const chokidarOpts = {ignored: path.join(process.cwd(), config.destBase, '**')};

    chokidar.watch(Object.keys(watchFiles), chokidarOpts).on('change', (_path) => {
      make({watch: true, paths: [{path: watchFiles[_path]}]}).then(destPaths => {
        bs.reload(destPaths);
      });
    });
  }

  bs.init({server: config.serveRoot, notify: false, ghostMode: false});
}
