// !! This module defines a way to attach ‘input rules’ to an editor,
// which can react to or transform text typed by the user. It also
// comes with a bunch of default rules that can be enabled with the
// `autoInput` option.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("./autoinput");

var _inputrules = require("./inputrules");

Object.defineProperty(exports, "InputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.InputRule;
  }
});
Object.defineProperty(exports, "defineInputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.defineInputRule;
  }
});
Object.defineProperty(exports, "addInputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.addInputRule;
  }
});
Object.defineProperty(exports, "removeInputRule", {
  enumerable: true,
  get: function get() {
    return _inputrules.removeInputRule;
  }
});