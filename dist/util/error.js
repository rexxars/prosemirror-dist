// ;; Superclass for ProseMirror-related errors. Does some magic to
// make it safely subclassable even on ES5 runtimes.
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ProseMirrorError = (function (_Error) {
  _inherits(ProseMirrorError, _Error);

  // :: (string)
  // Create an instance of this error type, capturing the current
  // stack.

  function ProseMirrorError(message) {
    _classCallCheck(this, ProseMirrorError);

    _get(Object.getPrototypeOf(ProseMirrorError.prototype), "constructor", this).call(this, message);
    if (this.message != message) {
      this.message = message;
      if (Error.captureStackTrace) Error.captureStackTrace(this, this.name);else this.stack = new Error(message).stack;
    }
  }

  // ;; Error type used to signal miscellaneous invariant violations.

  _createClass(ProseMirrorError, [{
    key: "name",
    get: function get() {
      return this.constructor.name || functionName(this.constructor) || "ProseMirrorError";
    }

    // :: (string)
    // Raise an exception of this type, with the given message.
    // (Somewhat shorter than `throw new ...`, and can appear in
    // expression position.)
  }], [{
    key: "raise",
    value: function raise(message) {
      throw new this(message);
    }
  }]);

  return ProseMirrorError;
})(Error);

exports.ProseMirrorError = ProseMirrorError;

var AssertionError = (function (_ProseMirrorError) {
  _inherits(AssertionError, _ProseMirrorError);

  function AssertionError() {
    _classCallCheck(this, AssertionError);

    _get(Object.getPrototypeOf(AssertionError.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; Error type used to report name clashes or other violations in
  // namespacing.
  return AssertionError;
})(ProseMirrorError);

exports.AssertionError = AssertionError;

var NamespaceError = (function (_ProseMirrorError2) {
  _inherits(NamespaceError, _ProseMirrorError2);

  function NamespaceError() {
    _classCallCheck(this, NamespaceError);

    _get(Object.getPrototypeOf(NamespaceError.prototype), "constructor", this).apply(this, arguments);
  }

  return NamespaceError;
})(ProseMirrorError);

exports.NamespaceError = NamespaceError;

function functionName(f) {
  var match = /^function (\w+)/.exec(f.toString());
  return match && match[1];
}