"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _templateObject = /*#__PURE__*/ _taggedTemplateLiteral(["\n  font-size: ", "px;\n  font-family: 'Yesteryear', cursive;\n  width: max-content;\n  position: relative;\n  /* font-weight: bold; */\n\n  &::after {\n    content: '\uD83D\uDD25';\n    position: absolute;\n    right: 0;\n    transform-origin: top right;\n    transform: translate(30%, 23%) scale(0.5) rotate(30deg);\n    z-index: -1;\n  }\n"]);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var Wrapper = _styledComponents.default.div(_templateObject, function (props) {
  return props.size;
});

var Logo = function Logo(_ref) {
  var size = _ref.size;
  return _react.default.createElement(Wrapper, {
    size: size
  }, "flamb\xE9");
};

var _default = Logo;
var _default2 = _default;
exports.default = _default2;
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