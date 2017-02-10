const path = require('path');
const _ = require('lodash');
const chokidar = require('chokidar');
const bs = require('browser-sync').create();
const config = require('../config');
const cache = require ('../utils/cache');
const make = require('./make');
const requireDir = require('require-dir');
const plugins = requireDir('../plugins', {camelcase: true});

module.exports = serve;

function serve() {
  if (process.env.task !== 'build') {

    const srcDirResolved = path.resolve(config.srcDir);

    const aboveSrcPaths = _(cache.get('files'))
      .keys()
      .concat(_.map(cache.get('deps'), 'srcResolved'))
      .filter(srcResolved => !srcResolved.startsWith(srcDirResolved))
      .uniq()
      .value();

    const watchOpts = {
      ignoreInitial: true
    };

    chokidar.watch([srcDirResolved, ...aboveSrcPaths], watchOpts).on('all', (event, changedPath) => {
      if (event !== 'change') {
        return make().then(() => bs.reload());
      }

      const file = cache.get('files', changedPath);
      const consumers = [];
      const assets = [];
      const reloadTargets = [];
      var shouldMake = false;
      var shouldMakeAll = false;

      if (_.includes(['asset', 'import', 'wrapper'], file.role)) {
        const deps = _(cache.get('deps'))
          .filter({srcResolved: changedPath})
          .map(dep => cache.get('files', dep.consumer))
          .uniq()
          .value();

        consumers.push(...deps);
      }

      if (file.role === 'asset') {
        assets.push(file);
        const assetConsumers = _.filter(consumers, {role: 'asset'});
        assets.push(...assetConsumers);
        reloadTargets.push(file.destResolved);
        reloadTargets.push(..._.map(assetConsumers, 'destResolved'));
        shouldMake = true;
      } else if (file.role === 'import') {
        const assetConsumers = _.filter(consumers, {role: 'asset'});
        assets.push(...assetConsumers);
        reloadTargets.push(..._.map(assetConsumers, 'destResolved'));
        shouldMake = true;
      } else if (file.role === 'data') {
        shouldMakeAll = true;
      } else if (file.role === 'template') {
        plugins.static(file);
      } else if (file.role === 'wrapper') {
        const templates = _.filter(consumers, {role: 'template'});
        templates.forEach(plugins.static);
      } else if (_.includes(['partial', 'lambda'], file.role)) {
        const opts = {
          shouldGetPartials: file.role === 'partial',
          shouldGetLambdas: file.role === 'lambda'
        };
        const templates = _.filter(cache.get('files'), {role: 'template'});
        templates.forEach(template => plugins.static(template, opts));
      } else {
        shouldMakeAll = true;
      }

      if (shouldMakeAll) {
        make().then(() => bs.reload());
      } else if (shouldMake) {
        make({assets, targeted: true}).then(() => bs.reload(reloadTargets));
      } else {
        bs.reload();
      }
    });
  }

  const bsOpts = {
    server: {
      baseDir: config.destDir,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    snippetOptions: {
      rule: {
        match: /$/,
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    notify: false,
    ghostMode: false
  };

  bs.init(bsOpts);
}
