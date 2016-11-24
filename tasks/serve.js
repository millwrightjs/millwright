const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const make = require('./make');

module.exports = serve;

function serve(opts) {
  if (opts && opts.watchFiles) {
    const chokidarOpts = {ignored: path.join(process.cwd(), config.destBase, '**')};

    chokidar.watch(Object.keys(watchFiles), chokidarOpts).on('change', (_path) => {
      make({watch: true, paths: {files: [watchFiles[_path]]}}).then(destPaths => {
        bs.reload(destPaths.files);
      });
    });
  }

  bs.init({server: config.serveRoot, notify: false, ghostMode: false});
}
