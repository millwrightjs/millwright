const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const requireDir = require('require-dir');
const tasks = requireDir('../tasks', {camelcase: true});

module.exports = serve;

function serve() {
  chokidar.watch(path.join(process.cwd(), '**/*.less')).on('change', () => {
    tasks['make']().then(() => {
      bs.reload(path.join(process.cwd(), 'dist', '**/*.css'));
    });
  });

  bs.init({server: config.serveRoot, notify: false, ghostMode: false});
}
