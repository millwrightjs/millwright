'use strict';

var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');
var config = require('../config');
var mustache = require('mustache');

var _require = require('../utils/util'),
    changeExt = _require.changeExt;

var cache = require('../utils/cache');

module.exports = staticGen;

var partials = void 0,
    lambdas = void 0;

function staticGen(file, opts) {
  opts = _.isObject(opts) ? opts : {};
  mustache.tags = config.templateTags;
  partials = !partials || opts.shouldGetPartials ? getPartials() : partials;
  lambdas = !lambdas || opts.shouldGetLambdas ? getLambdas() : lambdas;

  var src = file.src,
      dataPath = file.data,
      wrapperDataPath = file.wrapperData;

  var wrapper = _.has(file, 'wrapper') ? fs.readFileSync(file.wrapper, 'utf8') : '';
  var page = fs.readFileSync(src, 'utf8');

  var dataRef = cache.get('files', dataPath);
  var data = _.get(dataRef, 'content');
  var wrapperDataRef = cache.get('files', wrapperDataPath);
  var wrapperData = _.get(wrapperDataRef, 'content');
  var templateData = _.assign({}, wrapperData, data, { lambdas: lambdas });

  if (_.has(wrapperData, 'assets') && _.has(data, 'assets')) {
    templateData.assets = _.mergeWith({}, wrapperData.assets, data.assets, function (dest, src) {
      return [dest, src].every(_.isArray) ? _.union(dest, src) : undefined;
    });
  }

  var pagePartials = wrapper ? _.assign({}, partials, { page: page }) : partials;
  var result = mustache.render(wrapper || page, templateData, pagePartials);

  fs.outputFileSync(file.dest, result);

  if (data) {
    cache.push('deps', {
      src: dataRef.src,
      srcResolved: dataRef.srcResolved,
      consumer: file.srcResolved
    });
  }

  if (wrapperData) {
    cache.push('deps', {
      src: wrapperDataRef.src,
      srcResolved: wrapperDataRef.srcResolved,
      consumer: file.srcResolved
    });
  }

  if (wrapper) {
    var wrapperRef = cache.get('files', file.wrapper);
    cache.push('deps', {
      src: wrapperRef.src,
      srcResolved: wrapperRef.srcResolved,
      consumer: file.srcResolved
    });
  }
}

function getPartials() {
  var partialFileNames = _.attemptSilent(fs.readdirSync, config.partialsDir);
  return _.reduce(partialFileNames, function (obj, partialFileName) {
    var name = path.basename(partialFileName, '.mustache');
    var partialPath = path.join(config.partialsDir, partialFileName);
    delete require.cache[require.resolve(modulePath)];
    obj[name] = fs.readFileSync(partialPath).toString();
    return obj;
  }, {});
}

function getLambdas() {
  var lambdaFileNames = _.attemptSilent(fs.readdirSync, config.lambdasDir);
  return _.reduce(lambdaFileNames, function (obj, lambdaFileName) {
    var name = path.basename(lambdaFileName, '.js');
    var modulePath = path.join(process.cwd(), config.lambdasDir, name);
    var mod = require(modulePath).module;
    delete require.cache[require.resolve(modulePath)];
    obj[name] = function () {
      return mod.require(modulePath).lambda;
    };
    return obj;
  }, {});
}