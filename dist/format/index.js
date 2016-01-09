// !! This module provides a way to register and access functions that
// serialize and parse ProseMirror [documents](#Node) to and from
// various formats, along with the basic formats required to run the
// editor.
//
// These are the formats defined by this module:
//
// **`"json"`**
//   : Uses `Node.toJSON` and `Schema.nodeFromJSON` to convert a
//     document to and from JSON.
//
// **`"dom"`**
//   : Parses [DOM
//     Nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node),
//     serializes to a [DOM
//     fragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).
//     See `toDOM` and `fromDOM`.
//
// **`"html"`**
//   : Serialize to and parse from HTML text. See `toHTML` and `fromHTML`.
//
// **`"text"`**
//   : Convert to and from plain text. See `toText` and `fromText`.
//
// The [`markdown`](#markdown) module in the distribution defines an additional format:
//
// **`"markdown"`**
//   : Convert to and from [CommonMark](http://commonmark.org/) marked-up
//     text. See `toMarkdown` and `fromMarkdown`.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _register = require("./register");

Object.defineProperty(exports, "serializeTo", {
  enumerable: true,
  get: function get() {
    return _register.serializeTo;
  }
});
Object.defineProperty(exports, "knownTarget", {
  enumerable: true,
  get: function get() {
    return _register.knownTarget;
  }
});
Object.defineProperty(exports, "defineTarget", {
  enumerable: true,
  get: function get() {
    return _register.defineTarget;
  }
});
Object.defineProperty(exports, "parseFrom", {
  enumerable: true,
  get: function get() {
    return _register.parseFrom;
  }
});
Object.defineProperty(exports, "knownSource", {
  enumerable: true,
  get: function get() {
    return _register.knownSource;
  }
});
Object.defineProperty(exports, "defineSource", {
  enumerable: true,
  get: function get() {
    return _register.defineSource;
  }
});

var _from_dom = require("./from_dom");

Object.defineProperty(exports, "fromDOM", {
  enumerable: true,
  get: function get() {
    return _from_dom.fromDOM;
  }
});
Object.defineProperty(exports, "fromHTML", {
  enumerable: true,
  get: function get() {
    return _from_dom.fromHTML;
  }
});

var _to_dom = require("./to_dom");

Object.defineProperty(exports, "toDOM", {
  enumerable: true,
  get: function get() {
    return _to_dom.toDOM;
  }
});
Object.defineProperty(exports, "toHTML", {
  enumerable: true,
  get: function get() {
    return _to_dom.toHTML;
  }
});
Object.defineProperty(exports, "nodeToDOM", {
  enumerable: true,
  get: function get() {
    return _to_dom.nodeToDOM;
  }
});

var _from_text = require("./from_text");

Object.defineProperty(exports, "fromText", {
  enumerable: true,
  get: function get() {
    return _from_text.fromText;
  }
});

var _to_text = require("./to_text");

Object.defineProperty(exports, "toText", {
  enumerable: true,
  get: function get() {
    return _to_text.toText;
  }
});