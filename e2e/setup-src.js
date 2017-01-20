const path = require('path');
const test = require('ava').test;
const dircompare = require('dir-compare');
const _ = require('lodash');

module.exports = setup;

function setup(testPath) {
  const {dir: testDirFull, name: testFilename} = path.parse(testPath);
  const testName = path.basename(testDirFull);
  const cmdName = testFilename.split('.')[0];
  const testDir = `e2e/${testName}`;
  const destDir = `${testDir}/dest-${cmdName}`;
  const compareDirBase = `./${destDir}`;
  const compareDirA = compareDirBase;
  const compareDirB = `${compareDirBase}-snapshot`;
  const compareOpts = {compareContent: true};
  const message = `e2e - ${testName} - ${cmdName}`;

  process.env.MILL_TEST = 'TRUE';
  process.env.MILL_TEST_CMD = cmdName;
  process.env.MILL_TEST_SRC = `${testDir}/src`;
  process.env.MILL_TEST_DEST = `${testDir}/dest-${cmdName}`;

  const cmd = require('../dist/index');
  const compare = _.partial(dircompare.compare, compareDirA, compareDirB, compareOpts);
  const check = (t, c) => c.same ? t.pass() : t.fail();

  return {test, message, cmd, compare, check};
}
