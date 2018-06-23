function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  font-size: ", "px;\n  font-family: 'Yesteryear', cursive;\n  width: max-content;\n  position: relative;\n  /* font-weight: bold; */\n\n  &::after {\n    content: '\uD83D\uDD25';\n    position: absolute;\n    right: 0;\n    transform-origin: top right;\n    transform: translate(30%, 23%) scale(0.5) rotate(30deg);\n    z-index: -1;\n  }\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

/* ⚠️ The way I am doing multiple packages in a repo right now is haphazard. Be aware.

/* ⚠️🤯 ACTUALLY, should probably just use Bolt for yarn workspaces instead.
 I am already running into the problem of using babelrc from project root, babel from node_modules, etc when trying to publish this package that exists down in here

 */
import React from 'react';
import styled from 'styled-components';
var Wrapper = styled.div(_templateObject(), function (props) {
  return props.size;
});

var Logo = function Logo(_ref) {
  var size = _ref.size;
  return React.createElement(Wrapper, {
    size: size
  }, "flamb\xE9");
};

var _default = Logo;
export default _default;
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(Wrapper, "Wrapper", "index.js");

  __REACT_HOT_LOADER__.register(Logo, "Logo", "index.js");

  __REACT_HOT_LOADER__.register(_default, "default", "index.js");
}();

;