"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.toDOM = toDOM;
exports.nodeToDOM = nodeToDOM;
exports.toHTML = toHTML;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _model = require("../model");

var _register = require("./register");

// ;; Object used to to expose relevant values and methods
// to DOM serializer functions.

var DOMSerializer = (function () {
  function DOMSerializer(options) {
    _classCallCheck(this, DOMSerializer);

    // :: Object The options passed to the serializer.
    this.options = options || {};
    // :: DOMDocument The DOM document in which we are working.
    this.doc = this.options.document || window.document;
  }

  // :: (Node, ?Object) → DOMFragment
  // Serialize the content of the given node to a DOM fragment. When not
  // in the browser, the `document` option, containing a DOM document,
  // should be passed so that the serialize can create nodes.
  //
  // To define rendering behavior for your own [node](#NodeType) and
  // [mark](#MarkType) types, give them a `serializeDOM` method. This
  // method is passed a `Node` and a `DOMSerializer`, and should return
  // the [DOM
  // node](https://developer.mozilla.org/en-US/docs/Web/API/Node) that
  // represents this node and its content. For marks, that should be an
  // inline wrapping node like `<a>` or `<strong>`.
  //
  // Individual attributes can also define serialization behavior. If an
  // `Attribute` object has a `serializeDOM` method, that will be called
  // with the DOM node representing the node that the attribute applies
  // to and the atttribute's value, so that it can set additional DOM
  // attributes on the DOM node.

  // :: (string, ?Object, ...union<string, DOMNode>) → DOMNode
  // Create a DOM node of the given type, with (optionally) the given
  // attributes and content. Content elements may be strings (for text
  // nodes) or other DOM nodes.

  _createClass(DOMSerializer, [{
    key: "elt",
    value: function elt(type, attrs) {
      var result = this.doc.createElement(type);
      if (attrs) for (var _name in attrs) {
        if (_name == "style") result.style.cssText = attrs[_name];else if (attrs[_name]) result.setAttribute(_name, attrs[_name]);
      }

      for (var _len = arguments.length, content = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        content[_key - 2] = arguments[_key];
      }

      for (var i = 0; i < content.length; i++) {
        result.appendChild(typeof content[i] == "string" ? this.doc.createTextNode(content[i]) : content[i]);
      }return result;
    }
  }, {
    key: "renderNode",
    value: function renderNode(node, offset) {
      var dom = node.type.serializeDOM(node, this);
      if (this.options.onRender) dom = this.options.onRender(node, dom, offset) || dom;
      return dom;
    }
  }, {
    key: "renderContent",
    value: function renderContent(node, where) {
      if (!where) where = this.doc.createDocumentFragment();
      if (!node.isTextblock) this.renderBlocksInto(node, where);else if (this.options.renderInlineFlat) this.renderInlineFlatInto(node, where);else this.renderInlineInto(node, where);
      return where;
    }
  }, {
    key: "renderBlocksInto",
    value: function renderBlocksInto(parent, where) {
      for (var i = parent.iter(), child = undefined; child = i.next().value;) {
        if (this.options.path) this.options.path.push(i.offset - child.width);
        where.appendChild(this.renderNode(child, i.offset - child.width));
        if (this.options.path) this.options.path.pop();
      }
    }
  }, {
    key: "renderInlineInto",
    value: function renderInlineInto(parent, where) {
      var _this = this;

      var top = where;
      var active = [];
      parent.forEach(function (node, offset) {
        var keep = 0;
        for (; keep < Math.min(active.length, node.marks.length); ++keep) if (!node.marks[keep].eq(active[keep])) break;
        while (keep < active.length) {
          active.pop();
          top = top.parentNode;
        }
        while (active.length < node.marks.length) {
          var add = node.marks[active.length];
          active.push(add);
          top = top.appendChild(_this.renderMark(add));
        }
        top.appendChild(_this.renderNode(node, offset));
      });
    }
  }, {
    key: "renderInlineFlatInto",
    value: function renderInlineFlatInto(parent, where) {
      var _this2 = this;

      parent.forEach(function (node, start) {
        var dom = _this2.renderNode(node, start);
        dom = _this2.wrapInlineFlat(dom, node.marks);
        dom = _this2.options.renderInlineFlat(node, dom, start) || dom;
        where.appendChild(dom);
      });
    }
  }, {
    key: "renderMark",
    value: function renderMark(mark) {
      return mark.type.serializeDOM(mark, this);
    }
  }, {
    key: "wrapInlineFlat",
    value: function wrapInlineFlat(dom, marks) {
      for (var i = marks.length - 1; i >= 0; i--) {
        var wrap = this.renderMark(marks[i]);
        wrap.appendChild(dom);
        dom = wrap;
      }
      return dom;
    }

    // :: (Node, string, ?Object) → DOMNode
    // Render the content of ProseMirror node into a DOM node with the
    // given tag name and attributes.
  }, {
    key: "renderAs",
    value: function renderAs(node, tagName, tagAttrs) {
      return this.renderContent(node, this.elt(tagName, tagAttrs));
    }
  }]);

  return DOMSerializer;
})();

function toDOM(node, options) {
  return new DOMSerializer(options).renderContent(node);
}

(0, _register.defineTarget)("dom", toDOM);

// :: (Node, ?Object) → DOMNode
// Serialize a given node to a DOM node. This is useful when you need
// to serialize a part of a document, as opposed to the whole
// document.

function nodeToDOM(node, options, offset) {
  var serializer = new DOMSerializer(options);
  var dom = serializer.renderNode(node, offset);
  if (node.isInline) {
    dom = serializer.wrapInlineFlat(dom, node.marks);
    if (serializer.options.renderInlineFlat) dom = options.renderInlineFlat(node, dom, offset) || dom;
  }
  return dom;
}

// :: (Node, ?Object) → string
// Serialize a node as an HTML string. Goes through `toDOM` and then
// serializes the result. Again, you must pass a `document` option
// when not in the browser.

function toHTML(node, options) {
  var serializer = new DOMSerializer(options);
  var wrap = serializer.elt("div");
  wrap.appendChild(serializer.renderContent(node));
  return wrap.innerHTML;
}

(0, _register.defineTarget)("html", toHTML);

// Block nodes

function def(cls, method) {
  cls.prototype.serializeDOM = method;
}

def(_model.BlockQuote, function (node, s) {
  return s.renderAs(node, "blockquote");
});

_model.BlockQuote.prototype.countCoordsAsChild = function (_, path, dom, coords) {
  var childBox = dom.firstChild.getBoundingClientRect();
  if (coords.left < childBox.left - 2) return _model.Pos.from(path);
};

def(_model.BulletList, function (node, s) {
  return s.renderAs(node, "ul");
});

def(_model.OrderedList, function (node, s) {
  return s.renderAs(node, "ol", { start: node.attrs.order != "1" && node.attrs.order });
});

_model.OrderedList.prototype.countCoordsAsChild = _model.BulletList.prototype.countCoordsAsChild = function (_, path, dom, coords) {
  for (var i = 0; i < dom.childNodes.length; i++) {
    var child = dom.childNodes[i];
    if (!child.hasAttribute("pm-offset")) continue;
    var childBox = child.getBoundingClientRect();
    if (coords.left > childBox.left - 2) return null;
    if (childBox.top <= coords.top && childBox.bottom >= coords.top) return new _model.Pos(path, i);
  }
};

def(_model.ListItem, function (node, s) {
  return s.renderAs(node, "li");
});

def(_model.HorizontalRule, function (_, s) {
  return s.elt("hr");
});

def(_model.Paragraph, function (node, s) {
  return s.renderAs(node, "p");
});

def(_model.Heading, function (node, s) {
  return s.renderAs(node, "h" + node.attrs.level);
});

def(_model.CodeBlock, function (node, s) {
  var code = s.renderAs(node, "code");
  if (node.attrs.params != null) code.className = "fence " + node.attrs.params.replace(/(^|\s+)/g, "$&lang-");
  return s.elt("pre", null, code);
});

// Inline content

def(_model.Text, function (node, s) {
  return s.doc.createTextNode(node.text);
});

def(_model.Image, function (node, s) {
  return s.elt("img", {
    src: node.attrs.src,
    alt: node.attrs.alt,
    title: node.attrs.title
  });
});

def(_model.HardBreak, function (_, s) {
  return s.elt("br");
});

// Inline styles

def(_model.EmMark, function (_, s) {
  return s.elt("em");
});

def(_model.StrongMark, function (_, s) {
  return s.elt("strong");
});

def(_model.CodeMark, function (_, s) {
  return s.elt("code");
});

def(_model.LinkMark, function (mark, s) {
  return s.elt("a", { href: mark.attrs.href,
    title: mark.attrs.title });
});