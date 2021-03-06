"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x16, _x17, _x18) { var _again = true; _function: while (_again) { var object = _x16, property = _x17, receiver = _x18; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x16 = parent; _x17 = property; _x18 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _error = require("./error");

// ;; A fragment is an abstract type used to represent a node's
// collection of child nodes. It tries to hide considerations about
// the actual way in which the child nodes are stored, so that
// different representations (nodes that only contain simple nodes
// versus nodes that also contain text) can be approached using the
// same API.
//
// Fragments are persistent data structures. That means you should
// _not_ mutate them or their content, but create new instances
// whenever needed. The API tries to make this easy.

var Fragment = (function () {
  function Fragment() {
    _classCallCheck(this, Fragment);
  }

  _createClass(Fragment, [{
    key: "append",

    // :: (Fragment, number, number) → Fragment
    // Create a fragment that combines this one with another fragment.
    // Takes care of merging adjacent text nodes and can also merge
    // “open” nodes at the boundary. `joinLeft` and `joinRight` give the
    // depth to which the left and right fragments are open. If open
    // nodes with the same markup are found on both sides, they are
    // joined. If not, the open nodes are [closed](#Node.close).
    value: function append(other) {
      var joinLeft = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var joinRight = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if (!this.size) return joinRight ? other.replace(0, other.firstChild.close(joinRight - 1, "start")) : other;
      if (!other.size) return joinLeft ? this.replace(this.size - 1, this.lastChild.close(joinLeft - 1, "end")) : this;
      return this.appendInner(other, joinLeft, joinRight);
    }

    // :: string
    // Concatenate all the text nodes found in this fragment and its
    // children.
  }, {
    key: "toString",

    // :: () → string
    // Return a debugging string that describes this fragment.
    value: function toString() {
      var str = "";
      this.forEach(function (n) {
        return str += (str ? ", " : "") + n.toString();
      });
      return str;
    }

    // :: (number, number, ?(Node) → Node) → [Node]
    // Produce an array with the child nodes between the given
    // boundaries, optionally mapping a function over them.
  }, {
    key: "toArray",
    value: function toArray(from, to, f) {
      if (from === undefined) from = 0;
      if (to === undefined) to = this.size;

      var result = [];
      for (var iter = this.iter(from, to), n = undefined; n = iter.next().value;) {
        result.push(f ? f(n) : n);
      }return result;
    }

    // :: ((Node) → Node) → Fragment
    // Produce a new Fragment by mapping all this fragment's children
    // through a function.
  }, {
    key: "map",
    value: function map(f) {
      return Fragment.fromArray(this.toArray(undefined, undefined, f));
    }

    // :: ((Node) → bool) → bool
    // Returns `true` if the given function returned `true` for any of
    // the fragment's children.
  }, {
    key: "some",
    value: function some(f) {
      for (var iter = this.iter(), n = undefined; n = iter.next().value;) {
        if (f(n)) return n;
      }
    }
  }, {
    key: "close",
    value: function close(depth, side) {
      var child = side == "start" ? this.firstChild : this.lastChild;
      var closed = child.close(depth - 1, side);
      if (closed == child) return this;
      return this.replace(side == "start" ? 0 : this.size - 1, closed);
    }
  }, {
    key: "nodesBetween",
    value: function nodesBetween(from, to, f, path, parent) {
      var moreFrom = from && from.depth > path.length,
          moreTo = to && to.depth > path.length;
      var start = moreFrom ? from.path[path.length] : from ? from.offset : 0;
      var end = moreTo ? to.path[path.length] + 1 : to ? to.offset : this.size;
      for (var iter = this.iter(start, end), node = undefined; node = iter.next().value;) {
        var startOffset = iter.offset - node.width;
        path.push(startOffset);
        node.nodesBetween(moreFrom && startOffset == start ? from : null, moreTo && iter.offset == end ? to : null, f, path, parent);
        path.pop();
      }
    }

    // :: (?Pos, ?Pos) → Fragment
    // Slice out the sub-fragment between the two given positions.
    // `null` can be passed for either to indicate the slice should go
    // all the way to the start or end of the fragment.
  }, {
    key: "sliceBetween",
    value: function sliceBetween(from, to) {
      var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      var moreFrom = from && from.depth > depth,
          moreTo = to && to.depth > depth;
      var start = moreFrom ? from.path[depth] : from ? from.offset : 0;
      var end = moreTo ? to.path[depth] + 1 : to ? to.offset : this.size;
      var nodes = [];
      for (var iter = this.iter(start, end), node = undefined; node = iter.next().value;) {
        var passFrom = moreFrom && iter.offset - node.width == start ? from : null;
        var passTo = moreTo && iter.offset == end ? to : null;
        if (passFrom || passTo) node = node.sliceBetween(passFrom, passTo, depth + 1);
        nodes.push(node);
      }
      return new this.constructor(nodes);
    }

    // :: (Schema, Object) → Fragment
    // Deserialize a fragment from its JSON representation.
  }, {
    key: "textContent",
    get: function get() {
      var text = "";
      this.forEach(function (n) {
        return text += n.textContent;
      });
      return text;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(schema, value) {
      return value ? this.fromArray(value.map(schema.nodeFromJSON)) : emptyFragment;
    }

    // :: ([Node]) → Fragment
    // Build a fragment from an array of nodes.
  }, {
    key: "fromArray",
    value: function fromArray(array) {
      if (!array.length) return emptyFragment;
      var hasText = false,
          joined = undefined;
      for (var i = 0; i < array.length; i++) {
        var node = array[i];
        if (node.isText) {
          hasText = true;
          if (i && array[i - 1].sameMarkup(node)) {
            if (!joined) joined = array.slice(0, i);
            joined[joined.length - 1] = node.copy(joined[joined.length - 1].text + node.text);
            continue;
          }
        }
        if (joined) joined.push(node);
      }
      return hasText ? new TextFragment(joined || array) : new FlatFragment(array);
    }

    // :: (?union<Fragment, Node, [Node]>) → Fragment
    // Create a fragment from something that can be interpreted as a set
    // of nodes. For `null`, it returns the empty fragment. For a
    // fragment, the fragment itself. For a node or array of nodes, a
    // fragment containing those nodes.
  }, {
    key: "from",
    value: function from(nodes) {
      if (!nodes) return emptyFragment;
      if (nodes instanceof Fragment) return nodes;
      return this.fromArray(Array.isArray(nodes) ? nodes : [nodes]);
    }
  }]);

  return Fragment;
})();

exports.Fragment = Fragment;

var iterEnd = { done: true };

var FlatIterator = (function () {
  function FlatIterator(array, pos, end) {
    _classCallCheck(this, FlatIterator);

    this.array = array;
    this.pos = pos;
    this.end = end;
  }

  _createClass(FlatIterator, [{
    key: "copy",
    value: function copy() {
      return new this.constructor(this.array, this.pos, this.end);
    }
  }, {
    key: "atEnd",
    value: function atEnd() {
      return this.pos == this.end;
    }
  }, {
    key: "next",
    value: function next() {
      return this.pos == this.end ? iterEnd : this.array[this.pos++];
    }
  }, {
    key: "offset",
    get: function get() {
      return this.pos;
    }
  }]);

  return FlatIterator;
})();

var ReverseFlatIterator = (function (_FlatIterator) {
  _inherits(ReverseFlatIterator, _FlatIterator);

  function ReverseFlatIterator() {
    _classCallCheck(this, ReverseFlatIterator);

    _get(Object.getPrototypeOf(ReverseFlatIterator.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; #forward=Fragment

  _createClass(ReverseFlatIterator, [{
    key: "next",
    value: function next() {
      return this.pos == this.end ? iterEnd : this.array[--this.pos];
    }
  }]);

  return ReverseFlatIterator;
})(FlatIterator);

var FlatFragment = (function (_Fragment) {
  _inherits(FlatFragment, _Fragment);

  function FlatFragment(content) {
    _classCallCheck(this, FlatFragment);

    _get(Object.getPrototypeOf(FlatFragment.prototype), "constructor", this).call(this);
    this.content = content;
  }

  // :: Fragment
  // An empty fragment. Intended to be reused whenever a node doesn't
  // contain anything (rather than allocating a new empty fragment for
  // each leaf node).

  // :: (?number, ?number) → Iterator<Node>
  // Create a forward iterator over the content of the fragment. An
  // explicit start and end offset can be given to have the iterator
  // go over only part of the content. If an iteration bound falls
  // within a text node, only the part that is within the bounds is
  // yielded.

  _createClass(FlatFragment, [{
    key: "iter",
    value: function iter() {
      var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var end = arguments.length <= 1 || arguments[1] === undefined ? this.size : arguments[1];

      return new FlatIterator(this.content, start, end);
    }

    // :: (?number, ?number) → Iterator<Node>
    // Create a reverse iterator over the content of the fragment. An
    // explicit start and end offset can be given to have the iterator
    // go over only part of the content. **Note**: `start` should be
    // greater than `end`, when passed.
  }, {
    key: "reverseIter",
    value: function reverseIter() {
      var start = arguments.length <= 0 || arguments[0] === undefined ? this.size : arguments[0];
      var end = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      return new ReverseFlatIterator(this.content, start, end);
    }

    // :: number
    // The maximum offset in this fragment.
  }, {
    key: "child",

    // :: (number) → Node
    // Get the child at the given offset. Might return a text node that
    // stretches before and/or after the offset.
    value: function child(off) {
      if (off < 0 || off >= this.content.length) _error.ModelError.raise("Offset " + off + " out of range");
      return this.content[off];
    }

    // :: ((node: Node, start: number, end: number))
    // Call the given function for each node in the fragment, passing it
    // the node, its start offset, and its end offset.
  }, {
    key: "forEach",
    value: function forEach(f) {
      for (var i = 0; i < this.content.length; i++) {
        f(this.content[i], i, i + 1);
      }
    }

    // :: (number) → {start: number, node: Node}
    // Find the node before the given offset. Returns an object
    // containing the node as well as its start index. Offset should be
    // greater than zero.
  }, {
    key: "chunkBefore",
    value: function chunkBefore(off) {
      return { node: this.child(off - 1), start: off - 1 };
    }

    // :: (number) → {start: number, node: Node}
    // Find the node after the given offset. Returns an object
    // containing the node as well as its start index. Offset should be
    // less than the fragment's size.
  }, {
    key: "chunkAfter",
    value: function chunkAfter(off) {
      return { node: this.child(off), start: off };
    }

    // :: (number, ?number) → Fragment
    // Return a fragment with only the nodes between the given offsets.
    // When `to` is not given, the slice will go to the end of the
    // fragment.
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.size : arguments[1];

      if (from == to) return emptyFragment;
      return new FlatFragment(this.content.slice(from, to));
    }

    // :: (number, Node) → Fragment
    // Return a fragment in which the node at the given offset is
    // replaced by the given node. The node, as well as the one it
    // replaces, should not be text nodes.
  }, {
    key: "replace",
    value: function replace(offset, node) {
      if (node.isText) _error.ModelError.raise("Argument to replace should be a non-text node");
      var copy = this.content.slice();
      copy[offset] = node;
      return new FlatFragment(copy);
    }
  }, {
    key: "appendInner",
    value: function appendInner(other, joinLeft, joinRight) {
      var last = this.content.length - 1,
          content = this.content.slice(0, last);
      var before = this.content[last],
          after = other.firstChild;
      if (joinLeft > 0 && joinRight > 0 && before.sameMarkup(after)) content.push(before.append(after.content, joinLeft - 1, joinRight - 1));else content.push(before.close(joinLeft - 1, "end"), after.close(joinRight - 1, "start"));
      return Fragment.fromArray(content.concat(other.toArray(after.width)));
    }

    // :: () → Object
    // Create a JSON-serializeable representation of this fragment.
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.content.map(function (n) {
        return n.toJSON();
      });
    }
  }, {
    key: "size",
    get: function get() {
      return this.content.length;
    }

    // :: ?Node
    // The first child of the fragment, or `null` if it is empty.
  }, {
    key: "firstChild",
    get: function get() {
      return this.content.length ? this.content[0] : null;
    }

    // :: ?Node
    // The last child of the fragment, or `null` if it is empty.
  }, {
    key: "lastChild",
    get: function get() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
  }]);

  return FlatFragment;
})(Fragment);

var emptyFragment = new FlatFragment([]);

exports.emptyFragment = emptyFragment;

var TextIterator = (function () {
  function TextIterator(fragment, startOffset, endOffset) {
    var pos = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

    _classCallCheck(this, TextIterator);

    this.frag = fragment;
    this.offset = startOffset;
    this.pos = pos;
    this.endOffset = endOffset;
  }

  _createClass(TextIterator, [{
    key: "copy",
    value: function copy() {
      return new this.constructor(this.frag, this.offset, this.endOffset, this.pos);
    }
  }, {
    key: "atEnd",
    value: function atEnd() {
      return this.offset == this.endOffset;
    }
  }, {
    key: "next",
    value: function next() {
      if (this.pos == -1) {
        var start = this.init();
        if (start) return start;
      }
      return this.offset == this.endOffset ? iterEnd : this.advance();
    }
  }, {
    key: "advance",
    value: function advance() {
      var node = this.frag.content[this.pos++],
          end = this.offset + node.width;
      if (end > this.endOffset) {
        node = node.copy(node.text.slice(0, this.endOffset - this.offset));
        this.offset = this.endOffset;
        return node;
      }
      this.offset = end;
      return node;
    }
  }, {
    key: "init",
    value: function init() {
      this.pos = 0;
      var offset = 0;
      while (offset < this.offset) {
        var node = this.frag.content[this.pos++],
            end = offset + node.width;
        if (end == this.offset) break;
        if (end > this.offset) {
          var sliceEnd = node.width;
          if (end > this.endOffset) {
            sliceEnd = this.endOffset - offset;
            end = this.endOffset;
          }
          node = node.copy(node.text.slice(this.offset - offset, sliceEnd));
          this.offset = end;
          return node;
        }
        offset = end;
      }
    }
  }]);

  return TextIterator;
})();

var ReverseTextIterator = (function (_TextIterator) {
  _inherits(ReverseTextIterator, _TextIterator);

  function ReverseTextIterator() {
    _classCallCheck(this, ReverseTextIterator);

    _get(Object.getPrototypeOf(ReverseTextIterator.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ReverseTextIterator, [{
    key: "advance",
    value: function advance() {
      var node = this.frag.content[--this.pos],
          end = this.offset - node.width;
      if (end < this.endOffset) {
        node = node.copy(node.text.slice(this.endOffset - end));
        this.offset = this.endOffset;
        return node;
      }
      this.offset = end;
      return node;
    }
  }, {
    key: "init",
    value: function init() {
      this.pos = this.frag.content.length;
      var offset = this.frag.size;
      while (offset > this.offset) {
        var node = this.frag.content[--this.pos],
            end = offset - node.width;
        if (end == this.offset) break;
        if (end < this.offset) {
          if (end < this.endOffset) {
            node = node.copy(node.text.slice(this.endOffset - end, this.offset - end));
            end = this.endOffset;
          } else {
            node = node.copy(node.text.slice(0, this.offset - end));
          }
          this.offset = end;
          return node;
        }
        offset = end;
      }
    }
  }]);

  return ReverseTextIterator;
})(TextIterator);

var TextFragment = (function (_Fragment2) {
  _inherits(TextFragment, _Fragment2);

  function TextFragment(content, size) {
    _classCallCheck(this, TextFragment);

    _get(Object.getPrototypeOf(TextFragment.prototype), "constructor", this).call(this);
    this.content = content;
    this.size = size || 0;
    if (size == null) for (var i = 0; i < content.length; i++) {
      this.size += content[i].width;
    }
  }

  _createClass(TextFragment, [{
    key: "iter",
    value: function iter() {
      var from = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.size : arguments[1];

      return new TextIterator(this, from, to);
    }
  }, {
    key: "reverseIter",
    value: function reverseIter() {
      var from = arguments.length <= 0 || arguments[0] === undefined ? this.size : arguments[0];
      var to = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      return new ReverseTextIterator(this, from, to);
    }
  }, {
    key: "child",
    value: function child(off) {
      if (off < 0 || off >= this.size) _error.ModelError.raise("Offset " + off + " out of range");
      for (var i = 0, curOff = 0; i < this.content.length; i++) {
        var child = this.content[i];
        curOff += child.width;
        if (curOff > off) return child;
      }
    }
  }, {
    key: "forEach",
    value: function forEach(f) {
      for (var i = 0, off = 0; i < this.content.length; i++) {
        var child = this.content[i];
        f(child, off, off += child.width);
      }
    }
  }, {
    key: "chunkBefore",
    value: function chunkBefore(off) {
      if (!off) _error.ModelError.raise("No chunk before start of node");
      for (var i = 0, curOff = 0; i < this.content.length; i++) {
        var child = this.content[i],
            end = curOff + child.width;
        if (end >= off) return { node: child, start: curOff };
        curOff = end;
      }
    }
  }, {
    key: "chunkAfter",
    value: function chunkAfter(off) {
      if (off == this.size) _error.ModelError.raise("No chunk after end of node");
      for (var i = 0, curOff = 0; i < this.content.length; i++) {
        var child = this.content[i],
            end = curOff + child.width;
        if (end > off) return { node: child, start: curOff };
        curOff = end;
      }
    }
  }, {
    key: "slice",
    value: function slice() {
      var from = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.size : arguments[1];

      if (from == to) return emptyFragment;
      return new TextFragment(this.toArray(from, to));
    }
  }, {
    key: "replace",
    value: function replace(off, node) {
      if (node.isText) _error.ModelError.raise("Argument to replace should be a non-text node");
      var curNode = undefined,
          index = undefined;
      for (var curOff = 0; curOff < off; index++) {
        curNode = this.content[index];
        curOff += curNode.width;
      }
      if (curNode.isText) _error.ModelError.raise("Can not replace text content with replace method");
      var copy = this.content.slice();
      copy[index] = node;
      return new TextFragment(copy);
    }
  }, {
    key: "appendInner",
    value: function appendInner(other, joinLeft, joinRight) {
      var last = this.content.length - 1,
          content = this.content.slice(0, last);
      var before = this.content[last],
          after = other.firstChild;
      var same = before.sameMarkup(after);
      if (same && before.isText) content.push(before.copy(before.text + after.text));else if (same && joinLeft > 0 && joinRight > 0) content.push(before.append(after.content, joinLeft - 1, joinRight - 1));else content.push(before.close(joinLeft - 1, "end"), after.close(joinRight - 1, "start"));
      return Fragment.fromArray(content.concat(other.toArray(after.width)));
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.content.map(function (n) {
        return n.toJSON();
      });
    }
  }, {
    key: "firstChild",
    get: function get() {
      return this.size ? this.content[0] : null;
    }
  }, {
    key: "lastChild",
    get: function get() {
      return this.size ? this.content[this.content.length - 1] : null;
    }
  }]);

  return TextFragment;
})(Fragment);

if (typeof Symbol != "undefined") {
  // :: () → Iterator<Node>
  // A fragment is iterable, in the ES6 sense.
  Fragment.prototype[Symbol.iterator] = function () {
    return this.iter();
  };
  FlatIterator.prototype[Symbol.iterator] = TextIterator.prototype[Symbol.iterator] = function () {
    return this;
  };
}