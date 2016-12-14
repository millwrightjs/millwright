const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const make = require('./make');

module.exports = serve;

function serve(opts) {
  if (opts && opts.watchFiles) {
    process.env.watch = true;
    const {watchFiles} = opts;
    const chokidarOpts = {ignored: path.join(process.cwd(), config.destBase, '**')};

    chokidar.watch(Object.keys(watchFiles), chokidarOpts).on('change', (_path) => {
      make({paths: [watchFiles[_path]]})[0].then(destPaths => {
        bs.reload(destPaths);
      });
    });
  }

  const bsOpts = {
    server: {
      baseDir: config.serveRoot,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    notify: false,
    ghostMode: false
  };

  bs.init(bsOpts);
}
