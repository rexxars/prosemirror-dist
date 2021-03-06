"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.redraw = redraw;

var _model = require("../model");

var _format = require("../format");

var _dom = require("../dom");

var _main = require("./main");

// FIXME clean up threading of path and offset, maybe remove from DOM renderer entirely

function options(path, ranges) {
  return {
    onRender: function onRender(node, dom, offset) {
      if (!node.isText && node.type.contains == null) {
        dom.contentEditable = false;
        if (node.isBlock) dom.setAttribute("pm-leaf", "true");
      }
      if (node.isBlock && offset != null) dom.setAttribute("pm-offset", offset);
      if (node.isTextblock) adjustTrailingHacks(dom, node);

      return dom;
    },
    renderInlineFlat: function renderInlineFlat(node, dom, offset) {
      ranges.advanceTo(new _model.Pos(path, offset));
      var end = new _model.Pos(path, offset + node.width);
      var nextCut = ranges.nextChangeBefore(end);

      var inner = dom,
          wrapped = undefined;
      for (var i = 0; i < node.marks.length; i++) {
        inner = inner.firstChild;
      }if (dom.nodeType != 1) {
        dom = (0, _dom.elt)("span", null, dom);
        if (!nextCut) wrapped = dom;
      }
      if (!wrapped && (nextCut || ranges.current.length)) {
        wrapped = inner == dom ? dom = (0, _dom.elt)("span", null, inner) : inner.parentNode.appendChild((0, _dom.elt)("span", null, inner));
      }

      dom.setAttribute("pm-offset", offset);
      if (node.type.contains == null) dom.setAttribute("pm-leaf", node.isText ? node.width : "true");

      var inlineOffset = 0;
      while (nextCut) {
        var size = nextCut - offset;
        var split = splitSpan(wrapped, size);
        if (ranges.current.length) split.className = ranges.current.join(" ");
        split.setAttribute("pm-inner-offset", inlineOffset);
        inlineOffset += size;
        offset += size;
        ranges.advanceTo(new _model.Pos(path, offset));
        if (!(nextCut = ranges.nextChangeBefore(end))) wrapped.setAttribute("pm-inner-offset", inlineOffset);
      }

      if (ranges.current.length) wrapped.className = ranges.current.join(" ");
      return dom;
    },
    document: document, path: path
  };
}

function splitSpan(span, at) {
  var textNode = span.firstChild,
      text = textNode.nodeValue;
  var newNode = span.parentNode.insertBefore((0, _dom.elt)("span", null, text.slice(0, at)), span);
  textNode.nodeValue = text.slice(at);
  return newNode;
}

function draw(pm, doc) {
  pm.content.textContent = "";
  pm.content.appendChild((0, _format.toDOM)(doc, options([], pm.ranges.activeRangeTracker())));
}

function adjustTrailingHacks(dom, node) {
  var needs = node.size == 0 || node.lastChild.type.isBR ? "br" : !node.lastChild.isText && node.lastChild.type.contains == null ? "text" : null;
  var last = dom.lastChild;
  var has = !last || last.nodeType != 1 || !last.hasAttribute("pm-ignore") ? null : last.nodeName == "BR" ? "br" : "text";
  if (needs != has) {
    if (has) dom.removeChild(last);
    if (needs) dom.appendChild(needs == "br" ? (0, _dom.elt)("br", { "pm-ignore": "trailing-break" }) : (0, _dom.elt)("span", { "pm-ignore": "cursor-text" }, ""));
  }
}

function findNodeIn(iter, node) {
  var copy = iter.copy();
  for (var child = undefined; child = copy.next().value;) {
    if (child == node) return child;
  }
}

function movePast(dom) {
  var next = dom.nextSibling;
  dom.parentNode.removeChild(dom);
  return next;
}

function redraw(pm, dirty, doc, prev) {
  var opts = options([], pm.ranges.activeRangeTracker());

  function scan(dom, node, prev) {
    var iNode = node.iter(),
        iPrev = prev.iter(),
        pChild = iPrev.next().value;
    var domPos = dom.firstChild;

    for (var child = undefined; child = iNode.next().value;) {
      var offset = iNode.offset - child.width,
          matching = undefined,
          reuseDOM = undefined;
      if (!node.isTextblock) opts.path.push(offset);

      if (pChild == child) {
        matching = pChild;
      } else if (matching = findNodeIn(iPrev, child)) {
        while (pChild != matching) {
          pChild = iPrev.next().value;
          domPos = movePast(domPos);
        }
      }

      if (matching && !dirty.get(matching)) {
        reuseDOM = true;
      } else if (pChild && !child.isText && child.sameMarkup(pChild) && dirty.get(pChild) != _main.DIRTY_REDRAW) {
        reuseDOM = true;
        if (pChild.type.contains) {
          var contentNode = domPos;
          for (;;) {
            var first = contentNode.firstChild;
            if (!first || first.hasAttribute("pm-ignore") || first.hasAttribute("pm-offset")) break;
            contentNode = first;
          }
          scan(contentNode, child, pChild);
        }
      } else {
        var rendered = (0, _format.nodeToDOM)(child, opts, offset);
        dom.insertBefore(rendered, domPos);
        reuseDOM = false;
      }

      if (reuseDOM) {
        domPos.setAttribute("pm-offset", offset);
        domPos = domPos.nextSibling;
        pChild = iPrev.next().value;
      }
      if (!node.isTextblock) opts.path.pop();
    }

    while (pChild) {
      domPos = movePast(domPos);
      pChild = iPrev.next().value;
    }
    if (node.isTextblock) adjustTrailingHacks(dom, node);
  }
  scan(pm.content, doc, prev);
}