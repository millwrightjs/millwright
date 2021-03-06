'use strict';

var build = require('./build');
var serve = require('./serve');

module.exports = preview;

function preview() {
  return build().then(serve);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90YXNrcy9wcmV2aWV3LmpzIl0sIm5hbWVzIjpbImJ1aWxkIiwicmVxdWlyZSIsInNlcnZlIiwibW9kdWxlIiwiZXhwb3J0cyIsInByZXZpZXciLCJ0aGVuIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLFFBQVFDLFFBQVEsU0FBUixDQUFkO0FBQ0EsSUFBTUMsUUFBUUQsUUFBUSxTQUFSLENBQWQ7O0FBRUFFLE9BQU9DLE9BQVAsR0FBaUJDLE9BQWpCOztBQUVBLFNBQVNBLE9BQVQsR0FBbUI7QUFDakIsU0FBT0wsUUFBUU0sSUFBUixDQUFhSixLQUFiLENBQVA7QUFDRCIsImZpbGUiOiJwcmV2aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgYnVpbGQgPSByZXF1aXJlKCcuL2J1aWxkJyk7XG5jb25zdCBzZXJ2ZSA9IHJlcXVpcmUoJy4vc2VydmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBwcmV2aWV3O1xuXG5mdW5jdGlvbiBwcmV2aWV3KCkge1xuICByZXR1cm4gYnVpbGQoKS50aGVuKHNlcnZlKTtcbn1cbiJdfQ==