const build = require('./build');
const serve = require('./serve');

module.exports = preview;

function preview() {
  return build().then(serve);
}
