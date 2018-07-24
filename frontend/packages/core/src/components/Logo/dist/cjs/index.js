"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n  font-size: ", "px;\n  font-family: 'Yesteryear', cursive, sans-serif;\n  position: relative;\n  font-weight: normal;\n\n  &::after {\n    content: '\uD83D\uDD25';\n    position: absolute;\n    right: 0;\n    transform-origin: top right;\n    transform: translate(31%, 23%) scale(0.5) rotate(30deg);\n    z-index: -2;\n  ", "\n"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n  position: relative;\n  width: max-content;\n  z-index: 1;\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var Wrapper = _styledComponents.default.div(_templateObject());

var H1 = _styledComponents.default.h1(_templateObject2(), function (props) {
  return props.size;
}, function (props) {
  return !props.isAnimated ? "\n  }" : "\n    filter: hue-rotate(0);\n    animation: rotateHue 1s infinite alternate;\n  }\n\n  &:hover {\n    &::after {\n      animation: bluerRotate 0.5s infinite alternate linear;\n    }\n  }\n\n\n  @keyframes rotateHue {\n    to {\n      filter: hue-rotate(-45deg);\n    }\n  }\n\n  @keyframes bluerRotate {\n    to {\n      filter: hue-rotate(-180deg);\n    }\n  }\n  ";
});

var Logo = function Logo(_ref) {
  var size = _ref.size,
      isAnimated = _ref.isAnimated;
  return _react.default.createElement(Wrapper, null, _react.default.createElement(H1, {
    isAnimated: isAnimated,
    size: size || 40
  }, "flamb\xE9"));
};

var _default = Logo;
exports.default = _default;