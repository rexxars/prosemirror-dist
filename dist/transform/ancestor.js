"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canLift = canLift;
exports.canWrap = canWrap;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

var _map = require("./map");

// !! **`ancestor`**
//    : Change the stack of nodes that wrap the part of the document
//      between `from` and `to`, which must point into the same parent
//      node.
//
//      The set of ancestors to replace is determined by the `depth`
//      property of the step's parameter. If this is greater than
//      zero, `from` and `to` must point at the start and end of a
//      stack of nodes, of that depth, since this step will not split
//      nodes.
//
//      The set of new ancestors to wrap with is determined by the
//      `types` and `attrs` properties of the parameter. The first
//      should be an array of `NodeType`s, and the second, optionally,
//      an array of attribute objects.

_step.Step.define("ancestor", {
  apply: function apply(doc, step) {
    var from = step.from,
        to = step.to;
    if (!(0, _tree.isFlatRange)(from, to)) return null;
    var toParent = from.path,
        start = from.offset,
        end = to.offset;
    var _step$param = step.param;
    var _step$param$depth = _step$param.depth;
    var depth = _step$param$depth === undefined ? 0 : _step$param$depth;
    var _step$param$types = _step$param.types;
    var types = _step$param$types === undefined ? [] : _step$param$types;
    var _step$param$attrs = _step$param.attrs;
    var attrs = _step$param$attrs === undefined ? [] : _step$param$attrs;

    var inner = doc.path(from.path);
    for (var i = 0; i < depth; i++) {
      if (start > 0 || end < doc.path(toParent).size || toParent.length == 0) return null;
      start = toParent[toParent.length - 1];
      end = start + 1;
      toParent = toParent.slice(0, toParent.length - 1);
    }
    if (depth == 0 && types.length == 0) return null;

    var parent = doc.path(toParent),
        parentSize = parent.size,
        newParent = undefined;
    if (parent.type.locked) return null;
    if (types.length) {
      var _ret = (function () {
        var lastWrapper = types[types.length - 1];
        var content = inner.content.slice(from.offset, to.offset);
        if (!parent.type.canContainType(types[0]) || content.some(function (n) {
          return !lastWrapper.canContain(n);
        }) || !inner.size && !lastWrapper.canBeEmpty || lastWrapper.locked) return {
            v: null
          };
        var node = null;
        for (var i = types.length - 1; i >= 0; i--) {
          node = types[i].create(attrs[i], node || content);
        }newParent = parent.splice(start, end, _model.Fragment.from(node));
      })();

      if (typeof _ret === "object") return _ret.v;
    } else {
      if (!parent.type.canContainFragment(inner.content) || !inner.size && start == 0 && end == parent.size && !parent.type.canBeEmpty) return null;
      newParent = parent.splice(start, end, inner.content);
    }
    var copy = doc.replaceDeep(toParent, newParent);

    var toInner = toParent.slice();
    for (var i = 0; i < types.length; i++) {
      toInner.push(i ? 0 : start);
    }var startOfInner = new _model.Pos(toInner, types.length ? 0 : start);
    var replaced = null;
    var insertedSize = types.length ? 1 : to.offset - from.offset;
    if (depth != types.length || depth > 1 || types.length > 1) {
      var posBefore = new _model.Pos(toParent, start);
      var posAfter1 = new _model.Pos(toParent, end),
          posAfter2 = new _model.Pos(toParent, start + insertedSize);
      var endOfInner = new _model.Pos(toInner, startOfInner.offset + (to.offset - from.offset));
      replaced = [new _map.ReplacedRange(posBefore, from, posBefore, startOfInner), new _map.ReplacedRange(to, posAfter1, endOfInner, posAfter2, posAfter1, posAfter2)];
    }
    var moved = [new _map.MovedRange(from, to.offset - from.offset, startOfInner)];
    if (end - start != insertedSize) moved.push(new _map.MovedRange(new _model.Pos(toParent, end), parentSize - end, new _model.Pos(toParent, start + insertedSize)));
    return new _step.StepResult(copy, new _map.PosMap(moved, replaced));
  },
  invert: function invert(step, oldDoc, map) {
    var types = [],
        attrs = [];
    if (step.param.depth) for (var i = 0; i < step.param.depth; i++) {
      var _parent = oldDoc.path(step.from.path.slice(0, step.from.path.length - i));
      types.unshift(_parent.type);
      attrs.unshift(_parent.attrs);
    }
    var newFrom = map.map(step.from).pos;
    var newTo = step.from.cmp(step.to) ? map.map(step.to, -1).pos : newFrom;
    return new _step.Step("ancestor", newFrom, newTo, null, { depth: step.param.types ? step.param.types.length : 0,
      types: types, attrs: attrs });
  },
  paramToJSON: function paramToJSON(param) {
    return { depth: param.depth,
      types: param.types && param.types.map(function (t) {
        return t.name;
      }),
      attrs: param.attrs };
  },
  paramFromJSON: function paramFromJSON(schema, json) {
    return { depth: json.depth,
      types: json.types && json.types.map(function (n) {
        return schema.nodeType(n);
      }),
      attrs: json.attrs };
  }
});

function canBeLifted(doc, range) {
  var content = [doc.path(range.from.path)],
      unwrap = false;
  for (;;) {
    var parentDepth = -1;

    var _loop = function (_node, i) {
      if (!content.some(function (inner) {
        return !_node.type.canContainContent(inner.type);
      })) parentDepth = i;
      _node = _node.child(range.from.path[i]);
      node = _node;
    };

    for (var node = doc, i = 0; i < range.from.path.length; i++) {
      _loop(node, i);
    }
    if (parentDepth > -1) return { path: range.from.path.slice(0, parentDepth), unwrap: unwrap };
    if (unwrap || !content[0].isBlock) return null;
    content = content[0].content.slice(range.from.offset, range.to.offset);
    unwrap = true;
  }
}

// :: (Node, Pos, ?Pos) → bool
// Tells you whether the given positions' [sibling
// range](#Node.siblingRange), or any of its ancestor nodes, can be
// lifted out of a parent.

function canLift(doc, from, to) {
  var range = doc.siblingRange(from, to || from);
  var found = canBeLifted(doc, range);
  if (found) return { found: found, range: range };
}

// :: (Pos, ?Pos) → Transform
// Lift the nearest liftable ancestor of the [sibling
// range](#Node.siblingRange) of the given positions out of its
// parent (or do nothing if no such node exists).
_transform.Transform.prototype.lift = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  return (function () {
    var can = canLift(this.doc, from, to);
    if (!can) return this;
    var found = can.found;
    var range = can.range;

    var depth = range.from.path.length - found.path.length;
    var rangeNode = found.unwrap && this.doc.path(range.from.path);

    for (var d = 0, pos = range.to;; d++) {
      if (pos.offset < this.doc.path(pos.path).size) {
        this.split(pos, depth - d);
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten(null, 1);
    }
    for (var d = 0, pos = range.from;; d++) {
      if (pos.offset > 0) {
        this.split(pos, depth - d);
        var cut = range.from.path.length - depth,
            path = pos.path.slice(0, cut).concat(pos.path[cut] + 1);
        while (path.length < range.from.path.length) path.push(0);
        range = { from: new _model.Pos(path, 0), to: new _model.Pos(path, range.to.offset - range.from.offset) };
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten();
    }
    if (found.unwrap) {
      for (var i = range.to.offset - 1; i > range.from.offset; i--) {
        this.join(new _model.Pos(range.from.path, i));
      }var size = 0;
      for (var i = rangeNode.iter(range.from.offset, range.to.offset), child = undefined; child = i.next().value;) {
        size += child.size;
      }var path = range.from.path.concat(range.from.offset);
      range = { from: new _model.Pos(path, 0), to: new _model.Pos(path, size) };
      ++depth;
    }
    this.step("ancestor", range.from, range.to, null, { depth: depth });
    return this;
  }).apply(this, arguments);
};

// :: (Node, Pos, ?Pos, NodeType) → bool
// Determines whether the [sibling range](#Node.siblingRange) of the
// given positions can be wrapped in the given node type.

function canWrap(doc, from, to, type) {
  var range = doc.siblingRange(from, to || from);
  if (range.from.offset == range.to.offset) return null;
  var parent = doc.path(range.from.path);
  var around = parent.type.findConnection(type);
  var inside = type.findConnection(parent.child(range.from.offset).type);
  if (around && inside) return { range: range, around: around, inside: inside };
}

// :: (Pos, ?Pos, NodeType, ?Object) → Transform
// Wrap the [sibling range](#Node.siblingRange) of the given positions
// in a node of the given type, with the given attributes (if
// possible).
_transform.Transform.prototype.wrap = function (from, to, type, wrapAttrs) {
  var can = canWrap(this.doc, from, to, type);
  if (!can) return this;
  var range = can.range;
  var around = can.around;
  var inside = can.inside;

  var types = around.concat(type).concat(inside);
  var attrs = around.map(function () {
    return null;
  }).concat(wrapAttrs).concat(inside.map(function () {
    return null;
  }));
  this.step("ancestor", range.from, range.to, null, { types: types, attrs: attrs });
  if (inside.length) {
    var toInner = range.from.path.slice();
    for (var i = 0; i < around.length + inside.length + 1; i++) {
      toInner.push(i ? 0 : range.from.offset);
    }for (var i = range.to.offset - 1 - range.from.offset; i > 0; i--) {
      this.split(new _model.Pos(toInner, i), inside.length);
    }
  }
  return this;
};

// :: (Pos, ?Pos, NodeType, ?Object) → Transform
// Set the type of all textblocks (partly) between `from` and `to` to
// the given node type with the given attributes.
_transform.Transform.prototype.setBlockType = function (from, to, type, attrs) {
  var _this = this;

  this.doc.nodesBetween(from, to || from, function (node, path) {
    if (node.isTextblock && !node.hasMarkup(type, attrs)) {
      path = path.slice();
      // Ensure all markup that isn't allowed in the new node type is cleared
      _this.clearMarkup(new _model.Pos(path, 0), new _model.Pos(path, node.size), type);
      _this.step("ancestor", new _model.Pos(path, 0), new _model.Pos(path, _this.doc.path(path).size), null, { depth: 1, types: [type], attrs: [attrs] });
      return false;
    }
  });
  return this;
};

// :: (Pos, NodeType, ?Object) → Transform
// Change the type and attributes of the node after `pos`.
_transform.Transform.prototype.setNodeType = function (pos, type, attrs) {
  var node = this.doc.nodeAfter(pos);
  var path = pos.toPath();
  this.step("ancestor", new _model.Pos(path, 0), new _model.Pos(path, node.size), null, { depth: 1, types: [type], attrs: [attrs] });
  return this;
};