"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _node = require("./node");

var _fragment = require("./fragment");

var _mark = require("./mark");

var _utilObj = require("../util/obj");

var _utilError = require("../util/error");

// ;; The exception type used to signal schema-related
// errors.

var SchemaError = (function (_ProseMirrorError) {
  _inherits(SchemaError, _ProseMirrorError);

  function SchemaError() {
    _classCallCheck(this, SchemaError);

    _get(Object.getPrototypeOf(SchemaError.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The [node](#NodeType) and [mark](#MarkType) types
  // that make up a schema have several things in common—they support
  // attributes, and you can [register](#SchemaItem.register) values
  // with them. This class implements this functionality, and acts as a
  // superclass to those `NodeType` and `MarkType`.
  return SchemaError;
})(_utilError.ProseMirrorError);

exports.SchemaError = SchemaError;

var SchemaItem = (function () {
  function SchemaItem() {
    _classCallCheck(this, SchemaItem);
  }

  // ;; Node types are objects allocated once per `Schema`
  // and used to tag `Node` instances with a type. They are
  // instances of sub-types of this class, and contain information about
  // the node type (its name, its allowed attributes, methods for
  // serializing it to various formats, information to guide
  // deserialization, and so on).

  _createClass(SchemaItem, [{
    key: "getDefaultAttrs",

    // For node types where all attrs have a default value (or which don't
    // have any attributes), build up a single reusable default attribute
    // object, and use it for all nodes that don't specify specific
    // attributes.
    value: function getDefaultAttrs() {
      var defaults = Object.create(null);
      for (var attrName in this.attrs) {
        var attr = this.attrs[attrName];
        if (attr["default"] == null) return null;
        defaults[attrName] = attr["default"];
      }
      return defaults;
    }
  }, {
    key: "computeAttrs",
    value: function computeAttrs(attrs, arg) {
      var built = Object.create(null);
      for (var _name in this.attrs) {
        var value = attrs && attrs[_name];
        if (value == null) {
          var attr = this.attrs[_name];
          if (attr["default"] != null) value = attr["default"];else if (attr.compute) value = attr.compute(this, arg);else SchemaError.raise("No value supplied for attribute " + _name);
        }
        built[_name] = value;
      }
      return built;
    }
  }, {
    key: "freezeAttrs",
    value: function freezeAttrs() {
      var frozen = Object.create(null);
      for (var _name2 in this.attrs) {
        frozen[_name2] = this.attrs[_name2];
      }Object.defineProperty(this, "attrs", { value: frozen });
    }

    // :: (string, *)
    // Register an element in this type's registry. That is, add `value`
    // to the array associated with `name` in the registry stored in
    // type's `prototype`. This is mostly used to attach things like
    // commands and parsing strategies to node types. See `Schema.registry`.
  }, {
    key: "attrs",

    // :: Object<Attribute>
    // The set of attributes to associate with each node or mark of this
    // type.
    get: function get() {
      return {};
    }

    // :: (Object<?Attribute>)
    // Add or remove attributes from this type. Expects an object
    // mapping names to either attributes (to add) or null (to remove
    // the attribute by that name).
  }], [{
    key: "updateAttrs",
    value: function updateAttrs(attrs) {
      this.prototype.attrs = overlayObj(this.prototype.attrs, attrs);
    }
  }, {
    key: "register",
    value: function register(name, value) {
      var registry = this.prototype.hasOwnProperty("registry") ? this.prototype.registry : this.prototype.registry = Object.create(null);(registry[name] || (registry[name] = [])).push(value);
    }
  }]);

  return SchemaItem;
})();

var NodeType = (function (_SchemaItem) {
  _inherits(NodeType, _SchemaItem);

  function NodeType(name, kind, schema) {
    _classCallCheck(this, NodeType);

    _get(Object.getPrototypeOf(NodeType.prototype), "constructor", this).call(this);
    // :: string
    // The name the node type has in this schema.
    this.name = name;
    this.kind = kind;
    // Freeze the attributes, to avoid calling a potentially expensive
    // getter all the time.
    this.freezeAttrs();
    this.defaultAttrs = this.getDefaultAttrs();
    // :: Schema
    // A link back to the `Schema` the node type belongs to.
    this.schema = schema;
  }

  // ;; Base type for block nodetypes.

  // :: bool
  // True if this is a block type.

  _createClass(NodeType, [{
    key: "canContainFragment",

    // :: (Fragment) → bool
    // Test whether the content of the given fragment could be contained
    // in this node type.
    value: function canContainFragment(fragment) {
      var _this = this;

      var ok = true;
      fragment.forEach(function (n) {
        if (!_this.canContain(n)) ok = false;
      });
      return ok;
    }

    // :: (Node) → bool
    // Test whether the given node could be contained in this node type.
  }, {
    key: "canContain",
    value: function canContain(node) {
      if (!this.canContainType(node.type)) return false;
      for (var i = 0; i < node.marks.length; i++) {
        if (!this.canContainMark(node.marks[i])) return false;
      }return true;
    }

    // :: (Mark) → bool
    // Test whether this node type can contain children with the given
    // mark.
  }, {
    key: "canContainMark",
    value: function canContainMark(mark) {
      var contains = this.containsMarks;
      if (contains === true) return true;
      if (contains) for (var i = 0; i < contains.length; i++) {
        if (contains[i] == mark.name) return true;
      }return false;
    }

    // :: (NodeType) → bool
    // Test whether this node type can contain nodes of the given node
    // type.
  }, {
    key: "canContainType",
    value: function canContainType(type) {
      return this.schema.subKind(type.kind, this.contains);
    }

    // :: (NodeType) → bool
    // Test whether the nodes that can be contained in the given node
    // type are a sub-type of the nodes that can be contained in this
    // type.
  }, {
    key: "canContainContent",
    value: function canContainContent(type) {
      return this.schema.subKind(type.contains, this.contains);
    }

    // :: (NodeType) → ?[NodeType]
    // Find a set of intermediate node types, possibly empty, that have
    // to be inserted between this type and `other` to put a node of
    // type `other` into this type.
  }, {
    key: "findConnection",
    value: function findConnection(other) {
      if (this.canContainType(other)) return [];

      var seen = Object.create(null);
      var active = [{ from: this, via: [] }];
      while (active.length) {
        var current = active.shift();
        for (var _name3 in this.schema.nodes) {
          var type = this.schema.nodes[_name3];
          if (type.defaultAttrs && !(type.contains in seen) && current.from.canContainType(type)) {
            var via = current.via.concat(type);
            if (type.canContainType(other)) return via;
            active.push({ from: type, via: via });
            seen[type.contains] = true;
          }
        }
      }
    }
  }, {
    key: "computeAttrs",
    value: function computeAttrs(attrs, content) {
      if (!attrs && this.defaultAttrs) return this.defaultAttrs;else return _get(Object.getPrototypeOf(NodeType.prototype), "computeAttrs", this).call(this, attrs, content);
    }

    // :: (?Object, ?Fragment, ?[Mark]) → Node
    // Create a `Node` of this type. The given attributes are
    // checked and defaulted (you can pass `null` to use the type's
    // defaults entirely, if no required attributes exist). `content`
    // may be a `Fragment`, a node, an array of nodes, or
    // `null`. Similarly `marks` may be `null` to default to the empty
    // set of marks.
  }, {
    key: "create",
    value: function create(attrs, content, marks) {
      return new _node.Node(this, this.computeAttrs(attrs, content), _fragment.Fragment.from(content), _mark.Mark.setFrom(marks));
    }
  }, {
    key: "createAutoFill",
    value: function createAutoFill(attrs, content, marks) {
      if ((!content || content.length == 0) && !this.canBeEmpty) content = this.defaultContent();
      return this.create(attrs, content, marks);
    }

    // :: bool
    // Controls whether this node is allowed to be empty.
  }, {
    key: "isBlock",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is a textblock type, a block that contains inline
    // content.
  }, {
    key: "isTextblock",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is an inline type.
  }, {
    key: "isInline",
    get: function get() {
      return false;
    }

    // :: bool
    // True if this is the text node type.
  }, {
    key: "isText",
    get: function get() {
      return false;
    }

    // :: bool
    // Controls whether nodes of this type can be selected (as a user
    // node selection).
  }, {
    key: "selectable",
    get: function get() {
      return true;
    }

    // :: bool
    // Controls whether this node type is locked.
  }, {
    key: "locked",
    get: function get() {
      return false;
    }

    // :: ?string
    // The kind of nodes this node may contain. `null` means it's a
    // leaf node.
  }, {
    key: "contains",
    get: function get() {
      return null;
    }

    // :: string
    // Controls the _kind_ of the node, which is used to determine valid
    // parent/child [relations](#NodeType.contains). Should be a single
    // name or space-separated string of kind names, where later names
    // are considered to be sub-kinds of former ones (for example
    // `"textblock paragraph"`). When you want to extend the superclass'
    // set of kinds, you can do something like
    //
    //     static get kinds() { return super.kind + " mykind" }
  }, {
    key: "canBeEmpty",
    get: function get() {
      return true;
    }
  }, {
    key: "containsMarks",

    // :: union<bool, [string]>
    // The mark types that child nodes of this node may have. `false`
    // means no marks, `true` means any mark, and an array of strings
    // can be used to explicitly list the allowed mark types.
    get: function get() {
      return false;
    }
  }], [{
    key: "compile",
    value: function compile(types, schema) {
      var result = Object.create(null);
      for (var _name4 in types) {
        var type = types[_name4];
        var kinds = type.kinds.split(" ");
        for (var i = 0; i < kinds.length; i++) {
          schema.registerKind(kinds[i], i ? kinds[i - 1] : null);
        }result[_name4] = new type(_name4, kinds[kinds.length - 1], schema);
      }
      for (var _name5 in result) {
        var contains = result[_name5].contains;
        if (contains && !(contains in schema.kinds)) SchemaError.raise("Node type " + _name5 + " is specified to contain non-existing kind " + contains);
      }
      if (!result.doc) SchemaError.raise("Every schema needs a 'doc' type");
      if (!result.text) SchemaError.raise("Every schema needs a 'text' type");

      return result;
    }
  }, {
    key: "kinds",
    get: function get() {
      return "node";
    }
  }]);

  return NodeType;
})(SchemaItem);

exports.NodeType = NodeType;

var Block = (function (_NodeType) {
  _inherits(Block, _NodeType);

  function Block() {
    _classCallCheck(this, Block);

    _get(Object.getPrototypeOf(Block.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; Base type for textblock node types.

  _createClass(Block, [{
    key: "defaultContent",
    value: function defaultContent() {
      var inner = this.schema.defaultTextblockType().create();
      var conn = this.findConnection(inner.type);
      if (!conn) SchemaError.raise("Can't create default content for " + this.name);
      for (var i = conn.length - 1; i >= 0; i--) {
        inner = conn[i].create(null, inner);
      }return _fragment.Fragment.from(inner);
    }
  }, {
    key: "contains",
    get: function get() {
      return "block";
    }
  }, {
    key: "isBlock",
    get: function get() {
      return true;
    }
  }, {
    key: "canBeEmpty",
    get: function get() {
      return this.contains == null;
    }
  }], [{
    key: "kinds",
    get: function get() {
      return "block";
    }
  }]);

  return Block;
})(NodeType);

exports.Block = Block;

var Textblock = (function (_Block) {
  _inherits(Textblock, _Block);

  function Textblock() {
    _classCallCheck(this, Textblock);

    _get(Object.getPrototypeOf(Textblock.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; Base type for inline node types.

  _createClass(Textblock, [{
    key: "contains",
    get: function get() {
      return "inline";
    }
  }, {
    key: "containsMarks",
    get: function get() {
      return true;
    }
  }, {
    key: "isTextblock",
    get: function get() {
      return true;
    }
  }, {
    key: "canBeEmpty",
    get: function get() {
      return true;
    }
  }]);

  return Textblock;
})(Block);

exports.Textblock = Textblock;

var Inline = (function (_NodeType2) {
  _inherits(Inline, _NodeType2);

  function Inline() {
    _classCallCheck(this, Inline);

    _get(Object.getPrototypeOf(Inline.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The text node type.

  _createClass(Inline, [{
    key: "isInline",
    get: function get() {
      return true;
    }
  }], [{
    key: "kinds",
    get: function get() {
      return "inline";
    }
  }]);

  return Inline;
})(NodeType);

exports.Inline = Inline;

var Text = (function (_Inline) {
  _inherits(Text, _Inline);

  function Text() {
    _classCallCheck(this, Text);

    _get(Object.getPrototypeOf(Text.prototype), "constructor", this).apply(this, arguments);
  }

  // Attribute descriptors

  // ;; Attributes are named strings associated with nodes and marks.
  // Each node type or mark type has a fixed set of attributes, which
  // instances of this class are used to control.

  _createClass(Text, [{
    key: "create",
    value: function create(attrs, content, marks) {
      return new _node.TextNode(this, this.computeAttrs(attrs, content), content, marks);
    }
  }, {
    key: "selectable",
    get: function get() {
      return false;
    }
  }, {
    key: "isText",
    get: function get() {
      return true;
    }
  }], [{
    key: "kinds",
    get: function get() {
      return _get(Object.getPrototypeOf(Text), "kinds", this) + " text";
    }
  }]);

  return Text;
})(Inline);

exports.Text = Text;

var Attribute =
// :: (Object)
// Create an attribute. `options` is an object containing the
// settings for the attributes. The following settings are
// supported:
//
// **`default`**`: ?string`
//   : The default value for this attribute, to choose when no
//     explicit value is provided.
//
// **`compute`**`: ?(Fragment) → string`
//   : A function that computes a default value for the attribute from
//     the node's content.
//
// **`label`**`: ?string`
//   : A user-readable text label associated with the attribute.
//
// Attributes that have no default or compute property must be
// provided whenever a node or mark of a type that has them is
// created.
function Attribute() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  _classCallCheck(this, Attribute);

  this["default"] = options["default"];
  this.compute = options.compute;
  this.label = options.label;
}

// Marks

// ;; Like nodes, marks (which are associated with nodes to signify
// things like emphasis or being part of a link) are tagged with type
// objects, which are instantiated once per `Schema`.
;

exports.Attribute = Attribute;

var MarkType = (function (_SchemaItem2) {
  _inherits(MarkType, _SchemaItem2);

  function MarkType(name, rank, schema) {
    _classCallCheck(this, MarkType);

    _get(Object.getPrototypeOf(MarkType.prototype), "constructor", this).call(this);
    // :: string
    // The name of the mark type.
    this.name = name;
    this.freezeAttrs();
    this.rank = rank;
    // :: Schema
    // The schema that this mark type instance is part of.
    this.schema = schema;
    var defaults = this.getDefaultAttrs();
    this.instance = defaults && new _mark.Mark(this, defaults);
  }

  // Schema specifications are data structures that specify a schema --
  // a set of node types, their names, attributes, and nesting behavior.

  // ;; A schema specification is a blueprint for an actual
  // `Schema`. It maps names to node and mark types, along
  // with extra information, such as additional attributes and changes
  // to node kinds and relations.
  //
  // A specification consists of an object that associates node names
  // with node type constructors and another similar object associating
  // mark names with mark type constructors.

  // :: number
  // Mark type ranks are used to determine the order in which mark
  // arrays are sorted. (If multiple mark types end up with the same
  // rank, they still get a fixed order in the schema, but there's no
  // guarantee what it will be.)

  _createClass(MarkType, [{
    key: "create",

    // :: (Object) → Mark
    // Create a mark of this type. `attrs` may be `null` or an object
    // containing only some of the mark's attributes. The others, if
    // they have defaults, will be added.
    value: function create(attrs) {
      if (!attrs && this.instance) return this.instance;
      return new _mark.Mark(this, this.computeAttrs(attrs));
    }
  }, {
    key: "removeFromSet",

    // :: ([Mark]) → [Mark]
    // When there is a mark of this type in the given set, a new set
    // without it is returned. Otherwise, the input set is returned.
    value: function removeFromSet(set) {
      for (var i = 0; i < set.length; i++) if (set[i].type == this) return set.slice(0, i).concat(set.slice(i + 1));
      return set;
    }

    // :: ([Mark]) → bool
    // Tests whether there is a mark of this type in the given set.
  }, {
    key: "isInSet",
    value: function isInSet(set) {
      for (var i = 0; i < set.length; i++) {
        if (set[i].type == this) return set[i];
      }
    }
  }], [{
    key: "getOrder",
    value: function getOrder(marks) {
      var sorted = [];
      for (var _name6 in marks) {
        sorted.push({ name: _name6, rank: marks[_name6].rank });
      }sorted.sort(function (a, b) {
        return a.rank - b.rank;
      });
      var ranks = Object.create(null);
      for (var i = 0; i < sorted.length; i++) {
        ranks[sorted[i].name] = i;
      }return ranks;
    }
  }, {
    key: "compile",
    value: function compile(marks, schema) {
      var order = this.getOrder(marks);
      var result = Object.create(null);
      for (var _name7 in marks) {
        result[_name7] = new marks[_name7](_name7, order[_name7], schema);
      }return result;
    }
  }, {
    key: "rank",
    get: function get() {
      return 50;
    }
  }]);

  return MarkType;
})(SchemaItem);

exports.MarkType = MarkType;

var SchemaSpec = (function () {
  // :: (?Object<NodeType>, ?Object<MarkType>)
  // Create a schema specification from scratch. The arguments map
  // node names to node type constructors and mark names to mark type
  // constructors.

  function SchemaSpec(nodes, marks) {
    _classCallCheck(this, SchemaSpec);

    this.nodes = nodes || {};
    this.marks = marks || {};
  }

  // :: (?Object<?NodeType>, ?Object<?MarkType>) → SchemaSpec
  // Base a new schema spec on this one by specifying nodes and marks
  // to add or remove.
  //
  // When `nodes` is passed, it should be an object mapping type names
  // to either `null`, to delete the type of that name, or to a
  // `NodeType` subclass, to add or replace the node type of that
  // name.
  //
  // Similarly, `marks` can be an object to add, change, or remove
  // [mark types](#MarkType) in the schema.

  _createClass(SchemaSpec, [{
    key: "update",
    value: function update(nodes, marks) {
      return new SchemaSpec(nodes ? overlayObj(this.nodes, nodes) : this.nodes, marks ? overlayObj(this.marks, marks) : this.marks);
    }
  }]);

  return SchemaSpec;
})();

exports.SchemaSpec = SchemaSpec;

function overlayObj(base, update) {
  var copy = (0, _utilObj.copyObj)(base);
  for (var _name8 in update) {
    var value = update[_name8];
    if (value == null) delete copy[_name8];else copy[_name8] = value;
  }
  return copy;
}

// ;; Each document is based on a single schema, which provides the
// node and mark types that it is made up of (which, in turn,
// determine the structure it is allowed to have).

var Schema = (function () {
  // :: (SchemaSpec)
  // Construct a schema from a specification.

  function Schema(spec) {
    _classCallCheck(this, Schema);

    // :: SchemaSpec
    // The specification on which the schema is based.
    this.spec = spec;
    this.kinds = Object.create(null);

    // :: Object<NodeType>
    // An object mapping the schema's node names to node type objects.
    this.nodes = NodeType.compile(spec.nodes, this);
    // :: Object<MarkType>
    // A map from mark names to mark type objects.
    this.marks = MarkType.compile(spec.marks, this);
    for (var prop in this.nodes) {
      if (prop in this.marks) SchemaError.raise(prop + " can not be both a node and a mark");
    } // :: Object
    // An object for storing whatever values modules may want to
    // compute and cache per schema. (If you want to store something
    // in it, try to use property names unlikely to clash.)
    this.cached = Object.create(null);

    this.node = this.node.bind(this);
    this.text = this.text.bind(this);
    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);
  }

  // :: (union<string, NodeType>, ?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
  // Create a node in this schema. The `type` may be a string or a
  // `NodeType` instance. Attributes will be extended
  // with defaults, `content` may be a `Fragment`,
  // `null`, a `Node`, or an array of nodes.
  //
  // When creating a text node, `content` should be a string and is
  // interpreted as the node's text.
  //
  // This method is bound to the Schema, meaning you don't have to
  // call it as a method, but can pass it to higher-order functions
  // and such.

  _createClass(Schema, [{
    key: "node",
    value: function node(type, attrs, content, marks) {
      if (typeof type == "string") type = this.nodeType(type);else if (!(type instanceof NodeType)) SchemaError.raise("Invalid node type: " + type);else if (type.schema != this) SchemaError.raise("Node type from different schema used (" + type.name + ")");

      return type.create(attrs, content, marks);
    }

    // :: (string, ?[Mark]) → Node
    // Create a text node in the schema. This method is bound to the Schema.
  }, {
    key: "text",
    value: function text(_text, marks) {
      return this.nodes.text.create(null, _text, _mark.Mark.setFrom(marks));
    }

    // :: () → ?NodeType
    // Return the default textblock type for this schema, or `null` if
    // it does not contain a node type with a `defaultTextblock`
    // property.
  }, {
    key: "defaultTextblockType",
    value: function defaultTextblockType() {
      var cached = this.cached.defaultTextblockType;
      if (cached !== undefined) return cached;
      for (var _name9 in this.nodes) {
        if (this.nodes[_name9].defaultTextblock) return this.cached.defaultTextblockType = this.nodes[_name9];
      }
      return this.cached.defaultTextblockType = null;
    }

    // :: (string, ?Object) → Mark
    // Create a mark with the named type
  }, {
    key: "mark",
    value: function mark(name, attrs) {
      var spec = this.marks[name] || SchemaError.raise("No mark named " + name);
      return spec.create(attrs);
    }

    // :: (Object) → Node
    // Deserialize a node from its JSON representation. This method is
    // bound.
  }, {
    key: "nodeFromJSON",
    value: function nodeFromJSON(json) {
      return _node.Node.fromJSON(this, json);
    }

    // :: (Object) → Mark
    // Deserialize a mark from its JSON representation. This method is
    // bound.
  }, {
    key: "markFromJSON",
    value: function markFromJSON(json) {
      if (typeof json == "string") return this.mark(json);
      return this.mark(json._, json);
    }

    // :: (string) → NodeType
    // Get the `NodeType` associated with the given name in
    // this schema, or raise an error if it does not exist.
  }, {
    key: "nodeType",
    value: function nodeType(name) {
      return this.nodes[name] || SchemaError.raise("Unknown node type: " + name);
    }
  }, {
    key: "registerKind",
    value: function registerKind(kind, sup) {
      if (kind in this.kinds) {
        if (this.kinds[kind] == sup) return;
        SchemaError.raise("Inconsistent superkinds for kind " + kind + ": " + sup + " and " + this.kinds[kind]);
      }
      if (this.subKind(kind, sup)) SchemaError.raise("Conflicting kind hierarchy through " + kind + " and " + sup);
      this.kinds[kind] = sup;
    }

    // :: (string, string) → bool
    // Test whether a node kind is a sub-kind of another kind.
  }, {
    key: "subKind",
    value: function subKind(sub, sup) {
      for (;;) {
        if (sub == sup) return true;
        sub = this.kinds[sub];
        if (!sub) return false;
      }
    }

    // :: (string, (value: *, source: union<NodeType, MarkType>, name: string))
    // Retrieve all registered items under the given name from this
    // schema. The given function will be called with each item, the
    // element—node type or mark type—that it was associated with, and
    // that element's name in the schema.
  }, {
    key: "registry",
    value: function registry(name, f) {
      for (var i = 0; i < 2; i++) {
        var obj = i ? this.marks : this.nodes;
        for (var tname in obj) {
          var type = obj[tname];
          if (type.constructor.prototype.hasOwnProperty("registry")) {
            var reg = type.registry[name];
            if (reg) for (var j = 0; j < reg.length; j++) {
              f(reg[j], type, tname);
            }
          }
        }
      }
    }
  }]);

  return Schema;
})();

exports.Schema = Schema;