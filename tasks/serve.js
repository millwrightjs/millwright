const path = require('path');
const _ = require('lodash');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const cache = require ('../utils/cache');
const make = require('./make');

module.exports = serve;

function serve() {
  if (process.env.task !== 'build') {
    process.env.watch = true;

    const chokidarOpts = {
      ignored: path.join(process.cwd(), config.destBase, '**')
    };

    const paths = _(cache.get('files'))
      .keys()
      .concat(_.map(cache.get('deps'), 'srcResolved'))
      .uniq()
      .value();

    chokidar.watch(paths).on('change', (changedPath) => {
      const role = _.get(cache.get('files', changedPath), 'role');
      /*
       * asset, template, import, wrapper, data, partial
       *
       * existing deps:
       * import -> asset
       *
       * establish the following deps:
       * wrapper -> template
       * data -> template
       *
       * For partials, rerun static for all pages
       */

      if (role === 'asset') {
        const file = cache.get('files', changedPath);
        make({assets: [file]}).then(() => {
          bs.reload(file.destResolved);
        });
      }

      if (['import', 'partial', 'wrapper', 'data'].includes(role)) {
        const consumers = _(cache.get('deps'))
          .filter({srcResolved: changedPath})
          .map('consumer')
          .uniq()
          .value();
        console.log(consumers);
      }

      /*
      const targets = importConsumers || cache.get('files', changedPath);

      make({assets: targets}).then(() => {
        bs.reload(changedPath);
      });
     */
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
