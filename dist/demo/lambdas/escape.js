'use strict';

var escape = require('escape-html');

module.exports = { module: module, lambda: lambda };

var unsetTags = '<!--{[{={{ }}=}]}-->';
var resetTags = '<!--{{={[{ }]}=}}-->';

function lambda(template) {
  return unsetTags + escape(template).trim() + resetTags;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kZW1vL2xhbWJkYXMvZXNjYXBlLmpzIl0sIm5hbWVzIjpbImVzY2FwZSIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwibGFtYmRhIiwidW5zZXRUYWdzIiwicmVzZXRUYWdzIiwidGVtcGxhdGUiLCJ0cmltIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLFNBQVNDLFFBQVEsYUFBUixDQUFmOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCLEVBQUNELGNBQUQsRUFBU0UsY0FBVCxFQUFqQjs7QUFFQSxJQUFNQyxrQ0FBTjtBQUNBLElBQU1DLGtDQUFOOztBQUVBLFNBQVNGLE1BQVQsQ0FBZ0JHLFFBQWhCLEVBQTBCO0FBQ3hCLFNBQU9GLFlBQVlMLE9BQU9PLFFBQVAsRUFBaUJDLElBQWpCLEVBQVosR0FBc0NGLFNBQTdDO0FBQ0QiLCJmaWxlIjoiZXNjYXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXNjYXBlID0gcmVxdWlyZSgnZXNjYXBlLWh0bWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7bW9kdWxlLCBsYW1iZGF9O1xuXG5jb25zdCB1bnNldFRhZ3MgPSBgPCEtLXtbez17eyB9fT19XX0tLT5gO1xuY29uc3QgcmVzZXRUYWdzID0gYDwhLS17ez17W3sgfV19PX19LS0+YDtcblxuZnVuY3Rpb24gbGFtYmRhKHRlbXBsYXRlKSB7XG4gIHJldHVybiB1bnNldFRhZ3MgKyBlc2NhcGUodGVtcGxhdGUpLnRyaW0oKSArIHJlc2V0VGFncztcbn1cbiJdfQ==