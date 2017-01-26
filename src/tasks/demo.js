const path = require('path');
const fs = require('fs-extra');
const pathExists = require('path-exists').sync;
const dev = require('./dev');

module.exports = demo;

function demo() {
  if (pathExists('src')) {
    console.log(`Millwright will only output the demo project if no 'src' directory exists.`);
    process.exit(1);
  }

  fs.copySync(path.join(__dirname, '../demo'), 'src');

  return dev();
}
