const path = require('path');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const cache = require ('../utils/cache');
const make = require('./make');

module.exports = serve;

function serve() {
  /*
  process.env.watch = true;

  const chokidarOpts = {
    ignored: path.join(process.cwd(), config.destBase, '**')
  };

  const paths = _(cache.get('files'))
    .keys()
    .concat(_.map(cache.get('imports'), 'srcResolved'))
    .uniq()
    .value();

  chokidar.watch(paths, chokidarOpts).on('change', (changedPath) => {
    const importConsumers = _(cache.get('imports'))
      .filter({srcResolved: changedPath})
      .map(imported => cache.get('files', imported.consumer))
      .uniq().value();

    const targets = importConsumers || cache.get('files', changedPath);

    make({assets: targets}).then(() => {
      bs.reload(changedPath);
    });
  });

 */

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
