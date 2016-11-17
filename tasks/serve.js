const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const make = require('./make');

module.exports = serve;

function serve() {
  const chokidarOpts = {ignored: path.join(process.cwd(), config.destBase, '**')};

  chokidar.watch(path.join(process.cwd(), '**/*.less'), chokidarOpts).on('change', () => {
    make().then(() => {
      bs.reload(path.join(process.cwd(), 'dist', '**/*.css'));
    });
  });

  bs.init({server: config.serveRoot, notify: false, ghostMode: false});
}
