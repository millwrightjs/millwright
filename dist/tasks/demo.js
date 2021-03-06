'use strict';

var path = require('path');
var fs = require('fs-extra');
var pathExists = require('path-exists').sync;
var dev = require('./dev');

module.exports = demo;

function demo() {
  if (pathExists('src')) {
    console.log('Millwright will only output the demo project if no \'src\' directory exists.');
    process.exit(1);
  }

  fs.copySync(path.join(__dirname, '../demo'), 'src');

  return dev();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9kZW1vLmpzIl0sIm5hbWVzIjpbInBhdGgiLCJyZXF1aXJlIiwiZnMiLCJwYXRoRXhpc3RzIiwic3luYyIsImRldiIsIm1vZHVsZSIsImV4cG9ydHMiLCJkZW1vIiwiY29uc29sZSIsImxvZyIsInByb2Nlc3MiLCJleGl0IiwiY29weVN5bmMiLCJqb2luIiwiX19kaXJuYW1lIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLE9BQU9DLFFBQVEsTUFBUixDQUFiO0FBQ0EsSUFBTUMsS0FBS0QsUUFBUSxVQUFSLENBQVg7QUFDQSxJQUFNRSxhQUFhRixRQUFRLGFBQVIsRUFBdUJHLElBQTFDO0FBQ0EsSUFBTUMsTUFBTUosUUFBUSxPQUFSLENBQVo7O0FBRUFLLE9BQU9DLE9BQVAsR0FBaUJDLElBQWpCOztBQUVBLFNBQVNBLElBQVQsR0FBZ0I7QUFDZCxNQUFJTCxXQUFXLEtBQVgsQ0FBSixFQUF1QjtBQUNyQk0sWUFBUUMsR0FBUjtBQUNBQyxZQUFRQyxJQUFSLENBQWEsQ0FBYjtBQUNEOztBQUVEVixLQUFHVyxRQUFILENBQVliLEtBQUtjLElBQUwsQ0FBVUMsU0FBVixFQUFxQixTQUFyQixDQUFaLEVBQTZDLEtBQTdDOztBQUVBLFNBQU9WLEtBQVA7QUFDRCIsImZpbGUiOiJkZW1vLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmNvbnN0IHBhdGhFeGlzdHMgPSByZXF1aXJlKCdwYXRoLWV4aXN0cycpLnN5bmM7XG5jb25zdCBkZXYgPSByZXF1aXJlKCcuL2RldicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlbW87XG5cbmZ1bmN0aW9uIGRlbW8oKSB7XG4gIGlmIChwYXRoRXhpc3RzKCdzcmMnKSkge1xuICAgIGNvbnNvbGUubG9nKGBNaWxsd3JpZ2h0IHdpbGwgb25seSBvdXRwdXQgdGhlIGRlbW8gcHJvamVjdCBpZiBubyAnc3JjJyBkaXJlY3RvcnkgZXhpc3RzLmApO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxuXG4gIGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kZW1vJyksICdzcmMnKTtcblxuICByZXR1cm4gZGV2KCk7XG59XG4iXX0=