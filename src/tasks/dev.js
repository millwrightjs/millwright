const make = require('./make');
const serve = require('./serve');

module.exports = dev;

function dev() {
  return make().then(serve);
}
