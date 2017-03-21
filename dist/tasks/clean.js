'use strict';

var fs = require('fs-extra');
var config = require('../config');

module.exports = clean;

function clean() {
  fs.removeSync(config.destDir);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9jbGVhbi5qcyJdLCJuYW1lcyI6WyJmcyIsInJlcXVpcmUiLCJjb25maWciLCJtb2R1bGUiLCJleHBvcnRzIiwiY2xlYW4iLCJyZW1vdmVTeW5jIiwiZGVzdERpciJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFNQSxLQUFLQyxRQUFRLFVBQVIsQ0FBWDtBQUNBLElBQU1DLFNBQVNELFFBQVEsV0FBUixDQUFmOztBQUVBRSxPQUFPQyxPQUFQLEdBQWlCQyxLQUFqQjs7QUFFQSxTQUFTQSxLQUFULEdBQWlCO0FBQ2ZMLEtBQUdNLFVBQUgsQ0FBY0osT0FBT0ssT0FBckI7QUFDRCIsImZpbGUiOiJjbGVhbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmNvbnN0IGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsZWFuO1xuXG5mdW5jdGlvbiBjbGVhbigpIHtcbiAgZnMucmVtb3ZlU3luYyhjb25maWcuZGVzdERpcik7XG59XG4iXX0=