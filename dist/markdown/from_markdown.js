"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.fromMarkdown = fromMarkdown;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _markdownIt = require("markdown-it");

var _markdownIt2 = _interopRequireDefault(_markdownIt);

var _model = require("../model");

var _format = require("../format");

var _utilError = require("../util/error");

// :: (Schema, string) → Node
// Parse a string as [CommonMark](http://commonmark.org/) markup, and
// create a ProseMirror document corresponding to its meaning. Note
// that, by default, some CommonMark features, namely inline HTML and
// tight lists, are not supported.

function fromMarkdown(schema, text) {
  var tokens = (0, _markdownIt2["default"])("commonmark").parse(text, {});
  var state = new MarkdownParseState(schema, tokens),
      doc = undefined;
  state.parseTokens(tokens);
  do {
    doc = state.closeNode();
  } while (state.stack.length);
  return doc;
}

// ;; #kind=interface #path=MarkdownParseSpec
// Schema-specific parsing logic can be defined by adding a
// `parseMarkdown` property to the prototype of your node or mark
// types, preferably using the type's [`register`](#SchemaItem.register)
// method, that contains an array of objects following this parsing
// specification interface.

// :: string #path=MarkdownParseSpec.token
// Used to specify the
// [markdown-it](https://github.com/markdown-it/markdown-it) token
// type that should trigger this specification.

// :: union<string, (state: MarkdownParseState, token: MarkdownToken) → Node> #path=MarkdownParseSpec.parse
// The parsing function for this token. It is, when a matching token
// is encountered, passed the parsing state and the token, and must
// return a `Node` if the parsing spec was for a node type, and a
// `Mark` if it was for a mark type.
//
// The function will be called so that `this` is bound to the node or
// mark type instance that the spec was associated with.
//
// As a shorthand, `parse` can be set to a string. You can use
// `"block"` to create a node of the type that this spec was
// associated with, and wrap the content between the open and close
// tokens in this node.
//
// Alternatively, it can be set to `"mark"`, if the spec is associated
// with a [mark type](#MarkType), which will cause the content between
// the opening and closing token to be marked with an instance of that
// mark type.

// :: ?union<Object, (MarkdownParseState, MarkdownToken) → Object> #path=MarkdownParseSpec.attrs
// When `parse` is set to a string, this property can be used to
// specify attributes for the node or mark. It may hold an object or a
// function that, when called with the [parser
// state](#MarkdownParseState) and the token object, returns an
// attribute object.

(0, _format.defineSource)("markdown", fromMarkdown);

var noMarks = [];

function maybeMerge(a, b) {
  if (a.isText && b.isText && _model.Mark.sameSet(a.marks, b.marks)) return a.copy(a.text + b.text);
}

// ;; Object used to track the context of a running parse,
// and to expose parsing-related methods to node-specific parsing
// functions.

var MarkdownParseState = (function () {
  function MarkdownParseState(schema, tokens) {
    _classCallCheck(this, MarkdownParseState);

    // :: Schema
    // The schema into which we are parsing.
    this.schema = schema;
    this.stack = [{ type: schema.nodes.doc, content: [] }];
    this.tokens = tokens;
    this.marks = noMarks;
    this.tokenTypes = tokenTypeInfo(schema);
  }

  _createClass(MarkdownParseState, [{
    key: "top",
    value: function top() {
      return this.stack[this.stack.length - 1];
    }
  }, {
    key: "push",
    value: function push(elt) {
      if (this.stack.length) this.top().content.push(elt);
    }

    // :: (string)
    // Adds the given text to the current position in the document,
    // using the current marks as styling.
  }, {
    key: "addText",
    value: function addText(text) {
      var nodes = this.top().content,
          last = nodes[nodes.length - 1];
      var node = this.schema.text(text, this.marks),
          merged = undefined;
      if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged;else nodes.push(node);
    }

    // :: (Mark)
    // Adds the given mark to the set of active marks.
  }, {
    key: "openMark",
    value: function openMark(mark) {
      this.marks = mark.addToSet(this.marks);
    }

    // :: (Mark)
    // Removes the given mark from the set of active marks.
  }, {
    key: "closeMark",
    value: function closeMark(mark) {
      this.marks = mark.removeFromSet(this.marks);
    }
  }, {
    key: "parseTokens",
    value: function parseTokens(toks) {
      for (var i = 0; i < toks.length; i++) {
        var tok = toks[i];
        this.tokenTypes[tok.type](this, tok);
      }
    }

    // :: (NodeType, ?Object, ?[Node]) → Node
    // Add a node at the current position.
  }, {
    key: "addNode",
    value: function addNode(type, attrs, content) {
      var node = type.createAutoFill(attrs, content, this.marks);
      this.push(node);
      return node;
    }

    // :: (NodeType, ?Object)
    // Wrap subsequent content in a node of the given type.
  }, {
    key: "openNode",
    value: function openNode(type, attrs) {
      this.stack.push({ type: type, attrs: attrs, content: [] });
    }

    // :: () → Node
    // Close and return the node that is currently on top of the stack.
  }, {
    key: "closeNode",
    value: function closeNode() {
      if (this.marks.length) this.marks = noMarks;
      var info = this.stack.pop();
      return this.addNode(info.type, info.attrs, info.content);
    }

    // :: (MarkdownToken, string) → any
    // Retrieve the named attribute from the given token.
  }, {
    key: "getAttr",
    value: function getAttr(tok, name) {
      if (tok.attrs) for (var i = 0; i < tok.attrs.length; i++) {
        if (tok.attrs[i][0] == name) return tok.attrs[i][1];
      }
    }
  }]);

  return MarkdownParseState;
})();

function tokenTypeInfo(schema) {
  return schema.cached.markdownTokens || (schema.cached.markdownTokens = summarizeTokens(schema));
}

function registerTokens(tokens, type, info) {
  if (info.parse == "block") {
    tokens[info.token + "_open"] = function (state, tok) {
      var attrs = typeof info.attrs == "function" ? info.attrs(state, tok) : info.attrs;
      state.openNode(type, attrs);
    };
    tokens[info.token + "_close"] = function (state) {
      return state.closeNode();
    };
  } else if (info.parse == "mark") {
    tokens[info.token + "_open"] = function (state, tok) {
      var attrs = info.attrs instanceof Function ? info.attrs(state, tok) : info.attrs;
      state.openMark(type.create(attrs));
    };
    tokens[info.token + "_close"] = function (state) {
      return state.closeMark(type);
    };
  } else if (info.parse) {
    tokens[info.token] = info.parse.bind(type);
  } else {
    _utilError.AssertionError.raise("Unrecognized markdown parsing spec: " + info);
  }
}

function summarizeTokens(schema) {
  var tokens = Object.create(null);
  tokens.text = function (state, tok) {
    return state.addText(tok.content);
  };
  tokens.inline = function (state, tok) {
    return state.parseTokens(tok.children);
  };
  tokens.softbreak = function (state) {
    return state.addText("\n");
  };

  schema.registry("parseMarkdown", function (info, type) {
    registerTokens(tokens, type, info);
  });
  return tokens;
}

_model.BlockQuote.register("parseMarkdown", { parse: "block", token: "blockquote" });

_model.Paragraph.register("parseMarkdown", { parse: "block", token: "paragraph" });

_model.ListItem.register("parseMarkdown", { parse: "block", token: "list_item" });

_model.BulletList.register("parseMarkdown", { parse: "block", token: "bullet_list" });

_model.OrderedList.register("parseMarkdown", { parse: "block", token: "ordered_list", attrs: function attrs(state, tok) {
    return {
      order: Number(state.getAttr(tok, "order") || 1)
    };
  } });

_model.Heading.register("parseMarkdown", { parse: "block", token: "heading", attrs: function attrs(_, tok) {
    return {
      level: tok.tag.slice(1)
    };
  } });

function trimTrailingNewline(str) {
  if (str.charAt(str.length - 1) == "\n") return str.slice(0, str.length - 1);
  return str;
}

function parseCodeBlock(state, tok) {
  state.openNode(this);
  state.addText(trimTrailingNewline(tok.content));
  state.closeNode();
}

_model.CodeBlock.register("parseMarkdown", { token: "code_block", parse: parseCodeBlock });
_model.CodeBlock.register("parseMarkdown", { token: "fence", parse: parseCodeBlock });

_model.HorizontalRule.register("parseMarkdown", { token: "hr", parse: function parse(state, tok) {
    state.addNode(this, { markup: tok.markup });
  } });

_model.Image.register("parseMarkdown", { token: "image", parse: function parse(state, tok) {
    state.addNode(this, { src: state.getAttr(tok, "src"),
      title: state.getAttr(tok, "title") || null,
      alt: tok.children[0] && tok.children[0].content || null });
  } });

_model.HardBreak.register("parseMarkdown", { token: "hardbreak", parse: function parse(state) {
    state.addNode(this);
  } });

// Inline marks

_model.EmMark.register("parseMarkdown", { parse: "mark", token: "em" });

_model.StrongMark.register("parseMarkdown", { parse: "mark", token: "strong" });

_model.LinkMark.register("parseMarkdown", {
  parse: "mark",
  token: "link",
  attrs: function attrs(state, tok) {
    return {
      href: state.getAttr(tok, "href"),
      title: state.getAttr(tok, "title") || null
    };
  }
});

_model.CodeMark.register("parseMarkdown", { token: "code_inline", parse: function parse(state, tok) {
    state.openMark(this.create());
    state.addText(tok.content);
    state.closeMark(this);
  } });