"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.fromDOM = fromDOM;
exports.fromHTML = fromHTML;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _model = require("../model");

var _register = require("./register");

// :: (Schema, DOMNode, ?Object) → Node
// Parse document from the content of a DOM node. To pass an explicit
// parent document (for example, when not in a browser window
// environment, where we simply use the global document), pass it as
// the `document` property of `options`.

function fromDOM(schema, dom, options) {
  if (!options) options = {};
  var context = new DOMParseState(schema, options.topNode || schema.node("doc"), options);
  var start = options.from ? dom.childNodes[options.from] : dom.firstChild;
  var end = options.to != null && dom.childNodes[options.to] || null;
  context.addAll(start, end, true);
  var doc = undefined;
  while (context.stack.length) doc = context.leave();
  return doc;
}

// ;; #path=DOMParseSpec #kind=interface
// To define the way [node](#NodeType) and [mark](#MarkType) types are
// parsed, you can associate one or more DOM parsing specifications to
// them using the [`register`](#SchemaItem.register) method with the
// `parseDOM` property name. Each of them defines a parsing strategy
// for a certain type of DOM node.
//
// Note that `Attribute`s may also contain a `parseDOM` property,
// which should _not_ be a `DOMParseSpec`, but simply a function that
// computes the attribute's value from a DOM node.

// :: ?string #path=DOMParseSpec.tag
// The (lower-case) tag name for which to activate this parser. When
// not given, it is activated for all nodes.

// :: ?number #path=DOMParseSpec.rank
// The precedence of this parsing strategy. Should be a number between
// 0 and 100, which determines when this parser gets a chance relative
// to others that apply to the node (low ranks go first). Defaults to
// 50.

// :: union<string, (dom: DOMNode, state: DOMParseState) → ?bool> #path=DOMParseSpec.parse
// The function that, given a DOM node, parses it, updating the parse
// state. It should return (the exact value) `false` when it wants to
// indicate that it was not able to parse this node. This function is
// called in such a way that `this` is bound to the type that the
// parse spec was associated with.
//
// When this is set to the string `"block"`, the content of the DOM
// node is parsed as the content in a node of the type that this spec
// was associated with.
//
// When set to the string `"mark"`, the content of the DOM node is
// parsed with an instance of the mark that this spec was associated
// with added to their marks.

(0, _register.defineSource)("dom", fromDOM);

// :: (Schema, string, ?Object) → Node
// Parses the HTML into a DOM, and then calls through to `fromDOM`.

function fromHTML(schema, html, options) {
  var wrap = (options && options.document || window.document).createElement("div");
  wrap.innerHTML = html;
  return fromDOM(schema, wrap, options);
}

(0, _register.defineSource)("html", fromHTML);

var blockElements = {
  address: true, article: true, aside: true, blockquote: true, canvas: true,
  dd: true, div: true, dl: true, fieldset: true, figcaption: true, figure: true,
  footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true,
  h6: true, header: true, hgroup: true, hr: true, li: true, noscript: true, ol: true,
  output: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true
};

var noMarks = [];

// ;; A state object used to track context during a parse,
// and to expose methods to custom parsing functions.

var DOMParseState = (function () {
  function DOMParseState(schema, topNode, options) {
    _classCallCheck(this, DOMParseState);

    // :: Object The options passed to this parse.
    this.options = options || {};
    // :: Schema The schema that we are parsing into.
    this.schema = schema;
    this.stack = [];
    this.marks = noMarks;
    this.closing = false;
    this.enter(topNode.type, topNode.attrs);
    this.nodeInfo = nodeInfo(schema);
  }

  _createClass(DOMParseState, [{
    key: "addDOM",
    value: function addDOM(dom) {
      if (dom.nodeType == 3) {
        var value = dom.nodeValue;
        var _top = this.top,
            last = undefined;
        if (/\S/.test(value) || _top.type.isTextblock) {
          value = value.replace(/\s+/g, " ");
          // If this starts with whitespace, and there is either no node
          // before it or a node that ends with whitespace, strip the
          // leading space.
          if (/^\s/.test(value) && (!(last = _top.content[_top.content.length - 1]) || last.type.name == "text" && /\s$/.test(last.text))) value = value.slice(1);
          if (value) this.insertNode(this.schema.text(value, this.marks));
        }
      } else if (dom.nodeType != 1 || dom.hasAttribute("pm-ignore")) {
        // Ignore non-text non-element nodes
      } else if (!this.parseNodeType(dom)) {
          this.addAll(dom.firstChild, null);
          var _name = dom.nodeName.toLowerCase();
          if (blockElements.hasOwnProperty(_name) && this.top.type == this.schema.defaultTextblockType()) this.closing = true;
        }
    }
  }, {
    key: "tryParsers",
    value: function tryParsers(parsers, dom) {
      if (parsers) for (var i = 0; i < parsers.length; i++) {
        var parser = parsers[i];
        if (parser.parse.call(parser.type, dom, this) !== false) return true;
      }
    }
  }, {
    key: "parseNodeType",
    value: function parseNodeType(dom) {
      return this.tryParsers(this.nodeInfo[dom.nodeName.toLowerCase()], dom) || this.tryParsers(this.nodeInfo._, dom);
    }
  }, {
    key: "addAll",
    value: function addAll(from, to, sync) {
      var stack = sync && this.stack.slice();
      for (var dom = from; dom != to; dom = dom.nextSibling) {
        this.addDOM(dom);
        if (sync && blockElements.hasOwnProperty(dom.nodeName.toLowerCase())) this.sync(stack);
      }
    }
  }, {
    key: "doClose",
    value: function doClose() {
      if (!this.closing || this.stack.length < 2) return;
      var left = this.leave();
      this.enter(left.type, left.attrs);
      this.closing = false;
    }
  }, {
    key: "insertNode",
    value: function insertNode(node) {
      if (this.top.type.canContain(node)) {
        this.doClose();
      } else {
        for (var i = this.stack.length - 1; i >= 0; i--) {
          var route = this.stack[i].type.findConnection(node.type);
          if (!route) continue;
          if (i == this.stack.length - 1) {
            this.doClose();
          } else {
            while (this.stack.length > i + 1) this.leave();
          }
          for (var j = 0; j < route.length; j++) {
            this.enter(route[j]);
          }if (this.marks.length) this.marks = noMarks;
          break;
        }
      }
      this.top.content.push(node);
      return node;
    }

    // :: (DOMNode, NodeType, ?Object, [Node]) → Node
    // Insert a node of the given type, with the given content, based on
    // `dom`, at the current position in the document.
  }, {
    key: "insert",
    value: function insert(type, attrs, content) {
      return this.insertNode(type.createAutoFill(attrs, content, this.marks));
    }
  }, {
    key: "enter",
    value: function enter(type, attrs) {
      if (this.marks.length) this.marks = noMarks;
      this.stack.push({ type: type, attrs: attrs, content: [] });
    }
  }, {
    key: "leave",
    value: function leave() {
      var top = this.stack.pop();
      var last = top.content[top.content.length - 1];
      if (last && last.isText && /\s$/.test(last.text)) top.content[top.content.length - 1] = last.copy(last.text.slice(0, last.text.length - 1));
      var node = top.type.createAutoFill(top.attrs, top.content);
      if (this.stack.length) this.insertNode(node);
      return node;
    }
  }, {
    key: "sync",
    value: function sync(stack) {
      while (this.stack.length > stack.length) this.leave();
      for (;;) {
        var n = this.stack.length - 1,
            one = this.stack[n],
            two = stack[n];
        if (one.type == two.type && _model.Node.sameAttrs(one.attrs, two.attrs)) break;
        this.leave();
      }
      while (stack.length > this.stack.length) {
        var add = stack[this.stack.length];
        this.enter(add.type, add.attrs);
      }
      if (this.marks.length) this.marks = noMarks;
      this.closing = false;
    }

    // :: (DOMNode, NodeType, ?Object)
    // Parse the contents of `dom` as children of a node of the given
    // type.
  }, {
    key: "wrapIn",
    value: function wrapIn(dom, type, attrs) {
      this.enter(type, attrs);
      this.addAll(dom.firstChild, null, true);
      this.leave();
    }

    // :: (DOMNode, Mark)
    // Parse the contents of `dom`, with `mark` added to the set of
    // current marks.
  }, {
    key: "wrapMark",
    value: function wrapMark(dom, mark) {
      var old = this.marks;
      this.marks = (mark.instance || mark).addToSet(old);
      this.addAll(dom.firstChild, null);
      this.marks = old;
    }
  }, {
    key: "top",
    get: function get() {
      return this.stack[this.stack.length - 1];
    }
  }]);

  return DOMParseState;
})();

function nodeInfo(schema) {
  return schema.cached.parseDOMNodes || (schema.cached.parseDOMNodes = summarizeNodeInfo(schema));
}

function summarizeNodeInfo(schema) {
  var tags = Object.create(null);
  tags._ = [];
  schema.registry("parseDOM", function (info, type) {
    var tag = info.tag || "_";
    var parse = info.parse;
    if (parse == "block") parse = function (dom, state) {
      state.wrapIn(dom, this);
    };else if (parse == "mark") parse = function (dom, state) {
      state.wrapMark(dom, this);
    };(tags[tag] || (tags[tag] = [])).push({
      type: type, parse: parse,
      rank: info.rank == null ? 50 : info.rank
    });
  });
  for (var tag in tags) {
    tags[tag].sort(function (a, b) {
      return a.rank - b.rank;
    });
  }return tags;
}

_model.Paragraph.register("parseDOM", { tag: "p", parse: "block" });

_model.BlockQuote.register("parseDOM", { tag: "blockquote", parse: "block" });

var _loop = function (i) {
  _model.Heading.register("parseDOM", {
    tag: "h" + i,
    parse: function parse(dom, state) {
      state.wrapIn(dom, this, { level: i });
    }
  });
};

for (var i = 1; i <= 6; i++) {
  _loop(i);
}_model.HorizontalRule.register("parseDOM", { tag: "hr", parse: "block" });

_model.CodeBlock.register("parseDOM", { tag: "pre", parse: function parse(dom, state) {
    var params = dom.firstChild && /^code$/i.test(dom.firstChild.nodeName) && dom.firstChild.getAttribute("class");
    if (params && /fence/.test(params)) {
      var found = [],
          re = /(?:^|\s)lang-(\S+)/g,
          m = undefined;
      while (m = re.test(params)) found.push(m[1]);
      params = found.join(" ");
    } else {
      params = null;
    }
    var text = dom.textContent;
    state.insert(this, { params: params }, text ? [state.schema.text(text)] : []);
  } });

_model.BulletList.register("parseDOM", { tag: "ul", parse: "block" });

_model.OrderedList.register("parseDOM", { tag: "ol", parse: function parse(dom, state) {
    var attrs = { order: dom.getAttribute("start") || 1 };
    state.wrapIn(dom, this, attrs);
  } });

_model.ListItem.register("parseDOM", { tag: "li", parse: "block" });

_model.HardBreak.register("parseDOM", { tag: "br", parse: function parse(_, state) {
    state.insert(this);
  } });

_model.Image.register("parseDOM", { tag: "img", parse: function parse(dom, state) {
    state.insert(this, {
      src: dom.getAttribute("src"),
      title: dom.getAttribute("title") || null,
      alt: dom.getAttribute("alt") || null
    });
  } });

// Inline style tokens

_model.LinkMark.register("parseDOM", { tag: "a", parse: function parse(dom, state) {
    var href = dom.getAttribute("href");
    if (!href) return false;
    state.wrapMark(dom, this.create({ href: href, title: dom.getAttribute("title") }));
  } });

_model.EmMark.register("parseDOM", { tag: "i", parse: "mark" });
_model.EmMark.register("parseDOM", { tag: "em", parse: "mark" });

_model.StrongMark.register("parseDOM", { tag: "b", parse: "mark" });
_model.StrongMark.register("parseDOM", { tag: "strong", parse: "mark" });

_model.CodeMark.register("parseDOM", { tag: "code", parse: "mark" });