module.exports = promisify;

function promisify(asset) {
  return Promise.resolve(asset);
}
