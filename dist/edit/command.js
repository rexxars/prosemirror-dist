"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.defineDefaultParamHandler = defineDefaultParamHandler;
exports.updateCommands = updateCommands;
exports.selectedNodeAttr = selectedNodeAttr;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _browserkeymap = require("browserkeymap");

var _browserkeymap2 = _interopRequireDefault(_browserkeymap);

var _model = require("../model");

var _transform = require("../transform");

var _dom = require("../dom");

var _utilSortedinsert = require("../util/sortedinsert");

var _utilSortedinsert2 = _interopRequireDefault(_utilSortedinsert);

var _utilError = require("../util/error");

var _utilObj = require("../util/obj");

var _base_commands = require("./base_commands");

// ;; A command is a named piece of functionality that can be bound to
// a key, shown in the menu, or otherwise exposed to the user.
//
// The commands available in a given editor are determined by the
// `commands` option. By default, they come from the `baseCommands`
// object and the commands [associated](#SchemaItem.register) with
// schema items. Registering a `CommandSpec` on a [node](#NodeType) or
// [mark](#MarkType) type will cause that command to come into scope
// in editors whose schema includes that item.

var Command = (function () {
  function Command(spec, self, name) {
    _classCallCheck(this, Command);

    // :: string The name of the command.
    this.name = name;
    if (!this.name) _utilError.NamespaceError.raise("Trying to define a command without a name");
    // :: CommandSpec The command's specifying object.
    this.spec = spec;
    this.self = self;
  }

  // :: (ProseMirror, ?[any]) → ?bool
  // Execute this command. If the command takes
  // [parameters](#Command.params), they can be passed as second
  // argument here, or omitted, in which case a [parameter
  // handler](#commandParamHandler) will be called to prompt the user
  // for values.
  //
  // Returns the value returned by the command spec's [`run`
  // method](#CommandSpec.run), or `false` if the command could not be
  // ran.

  _createClass(Command, [{
    key: "exec",
    value: function exec(pm, params) {
      var _this = this;

      var run = this.spec.run;
      if (!this.params.length) return run.call(this.self, pm);
      if (params) return run.call.apply(run, [this.self, pm].concat(_toConsumableArray(params)));
      var handler = pm.options.commandParamHandler || defaultParamHandler;
      if (!handler) return false;
      handler(pm, this, function (params) {
        if (params) run.call.apply(run, [_this.self, pm].concat(_toConsumableArray(params)));
      });
    }

    // :: (ProseMirror) → bool
    // Ask this command whether it is currently relevant, given the
    // editor's document and selection. If the command does not define a
    // [`select`](#CommandSpec.select) method, this always returns true.
  }, {
    key: "select",
    value: function select(pm) {
      var f = this.spec.select;
      return f ? f.call(this.self, pm) : true;
    }

    // :: (ProseMirror) → bool
    // Ask this command whether it is “active”. This is mostly used to
    // style inline mark icons (such as strong) differently when the
    // selection contains such marks.
  }, {
    key: "active",
    value: function active(pm) {
      var f = this.spec.active;
      return f ? f.call(this.self, pm) : false;
    }

    // :: [CommandParam]
    // Get the list of parameters that this command expects.
  }, {
    key: "params",
    get: function get() {
      return this.spec.params || empty;
    }

    // :: string
    // Get the label for this command.
  }, {
    key: "label",
    get: function get() {
      return this.spec.label || this.name;
    }
  }]);

  return Command;
})();

exports.Command = Command;

var empty = [];

function deriveCommandSpec(type, spec) {
  if (!spec.derive) return spec;
  var conf = typeof spec.derive == "object" ? spec.derive : {};
  var dname = conf.name || spec.name;
  var derive = type.constructor.deriveableCommands[dname];
  if (!derive) _utilError.AssertionError.raise("Don't know how to derive command " + dname);
  var derived = derive.call(type, conf);
  for (var prop in spec) {
    if (prop != "derive") derived[prop] = spec[prop];
  }return derived;
}

// ;; The type used as the value of the `commands` option. Allows you
// to specify the set of commands that are available in the editor by
// adding and modifying command specs.

var CommandSet = (function () {
  function CommandSet(base, op) {
    _classCallCheck(this, CommandSet);

    this.base = base;
    this.op = op;
  }

  // :: CommandSet
  // A set without any commands.

  // :: (union<Object<CommandSpec>, string>, ?(string, CommandSpec) → bool) → CommandSet
  // Add a set of commands, creating a new command set. If `set` is
  // the string `"schema"`, the commands are retrieved from the
  // editor's schema's [registry](#Schema.registry), otherwise, it
  // should be an object mapping command names to command specs.
  //
  // A filter function can be given to add only the commands for which
  // the filter returns true.

  _createClass(CommandSet, [{
    key: "add",
    value: function add(set, filter) {
      return new CommandSet(this, function (commands, schema) {
        function add(name, spec, self) {
          if (!filter || filter(name, spec)) {
            if (commands[name]) _utilError.AssertionError.raise("Duplicate definition of command " + name);
            commands[name] = new Command(spec, self, name);
          }
        }

        if (set === "schema") {
          schema.registry("command", function (spec, type, name) {
            add(name + ":" + spec.name, deriveCommandSpec(type, spec), type);
          });
        } else {
          for (var _name in set) {
            add(_name, set[_name]);
          }
        }
      });
    }

    // :: (Object<?CommandSpec>) → CommandSet
    // Create a new command set by adding, modifying, or deleting
    // commands. The `update` object can map a command name to `null` to
    // delete it, to a full `CommandSpec` (containing a `run` property)
    // to add it, or to a partial `CommandSpec` (without a `run`
    // property) to update some properties in the command by that name.
  }, {
    key: "update",
    value: function update(_update) {
      return new CommandSet(this, function (commands) {
        for (var _name2 in _update) {
          var spec = _update[_name2];
          if (!spec) {
            delete commands[_name2];
          } else if (spec.run) {
            commands[_name2] = new Command(spec, null, _name2);
          } else {
            var known = commands[_name2];
            if (known) commands[_name2] = new Command((0, _utilObj.copyObj)(spec, (0, _utilObj.copyObj)(known.spec)), known.self, _name2);
          }
        }
      });
    }
  }, {
    key: "derive",
    value: function derive(schema) {
      var commands = this.base ? this.base.derive(schema) : Object.create(null);
      this.op(commands, schema);
      return commands;
    }
  }]);

  return CommandSet;
})();

exports.CommandSet = CommandSet;
CommandSet.empty = new CommandSet(null, function () {
  return null;
});

// :: CommandSet
// The default value of the `commands` option. Includes the [base
// commands](#baseCommands) and the commands defined by the schema.
CommandSet["default"] = CommandSet.empty.add("schema").add(_base_commands.baseCommands);

// ;; #path=CommandSpec #kind=interface
// Commands are defined using objects that specify various aspects of
// the command. The only property that _must_ appear in a command spec
// is [`run`](#CommandSpec.run). You should probably also give your
// commands a `label`.

// :: string #path=CommandSpec.name
// Commands defined by [registering](#SchemaItem.register) them on
// schema items should include a `name` in the spec object. The final
// name of the command (the thing passed to
// [`execCommand`](#ProseMirror.execCommand)) will be this name
// prefixed by the node or mark name and a colon (for example
// `"image:insert"`).

// :: string #path=CommandSpec.label
// A user-facing label for the command. This will be used, among other
// things. as the tooltip title for the command's menu item. If there
// is no `label`, the command's `name` will be used instead.

// :: (pm: ProseMirror, ...params: [any]) → ?bool #path=CommandSpec.run
// The function that executes the command. If the command has
// [parameters](#CommandSpec.params), their values are passed as
// arguments. For commands [registered](#SchemaItem.register) on node or
// mark types, `this` will be bound to the node or mark type when this
// function is ran. Should return `false` when the command could not
// be executed.

// :: [CommandParam] #path=CommandSpec.params
// The parameters that this command expects.

// :: (pm: ProseMirror) → bool #path=CommandSpec.select
// The function used to [select](#Command.select) the command. `this`
// will again be bound to a node or mark type, when available.

// :: (pm: ProseMirror) → bool #path=CommandSpec.active
// The function used to determine whether the command is
// [active](#Command.active). `this` refers to the associated node or
// mark type.

// :: union<string, [string]> #path=CommandSpec.keys
// The default key bindings for this command. May either be an array
// of strings containing [key
// names](https://github.com/marijnh/browserkeymap#a-string-notation-for-key-events),
// or an object with optional `all`, `mac`, and `pc` properties,
// specifying arrays of keys for different platforms.

// :: union<bool, Object> #path=CommandSpec.derive
// [Mark](#MarkType) and [node](#NodeType) types often need to define
// boilerplate commands. To reduce the amount of duplicated code, you
// can derive such commands by setting the `derive` property to either
// `true` or an object which is passed to the deriving function. If
// this object has a `name` property, that is used, instead of the
// command name, to pick a deriving function.
//
// For node types, you can derive `"insert"`, `"make"`, and `"wrap"`.
//
// For mark types, you can derive `"set"`, `"unset"`, and `"toggle"`.

// ;; #path=CommandParam #kind=interface
// The parameters that a command can take are specified using objects
// with the following properties:

// :: string #path=CommandParam.label
// The user-facing name of the parameter. Shown to the user when
// prompting for this parameter.

// :: string #path=CommandParam.type
// The type of the parameter. Supported types are `"text"` and `"select"`.

// :: any #path=CommandParam.default
// A default value for the parameter.

// :: (ProseMirror) → ?any #path=CommandParam.prefill
// A function that, given an editor instance (and a `this` bound to
// the command's source item), tries to derive an initial value for
// the parameter, or return null if it can't.

var defaultParamHandler = null;

// :: ((pm: ProseMirror, cmd: Command, callback: (?[any])), bool)
// Register a default [parameter handler](#commandParamHandler), which
// is a function that prompts the user to enter values for a command's
// [parameters](#CommandParam), and calls a callback with the values
// received. If `override` is set to false, the new handler will be
// ignored if another handler has already been defined.

function defineDefaultParamHandler(handler) {
  var override = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

  if (!defaultParamHandler || override) defaultParamHandler = handler;
}

function deriveKeymap(pm) {
  var bindings = {},
      platform = _dom.browser.mac ? "mac" : "pc";
  function add(command, keys) {
    for (var i = 0; i < keys.length; i++) {
      var _d$$exec = /^(.+?)(?:\((\d+)\))?$/.exec(keys[i]);

      var _d$$exec2 = _slicedToArray(_d$$exec, 3);

      var _ = _d$$exec2[0];
      var _name3 = _d$$exec2[1];
      var _d$$exec2$2 = _d$$exec2[2];
      var rank = _d$$exec2$2 === undefined ? 50 : _d$$exec2$2;

      (0, _utilSortedinsert2["default"])(bindings[_name3] || (bindings[_name3] = []), { command: command, rank: rank }, function (a, b) {
        return a.rank - b.rank;
      });
    }
  }
  for (var _name4 in pm.commands) {
    var cmd = pm.commands[_name4],
        keys = cmd.spec.keys;
    if (!keys) continue;
    if (Array.isArray(keys)) add(cmd, keys);
    if (keys.all) add(cmd, keys.all);
    if (keys[platform]) add(cmd, keys[platform]);
  }

  for (var key in bindings) {
    bindings[key] = bindings[key].map(function (b) {
      return b.command.name;
    });
  }return new _browserkeymap2["default"](bindings);
}

function updateCommands(pm, set) {
  // :: () #path=ProseMirror#events#commandsChanging
  // Fired before the set of commands for the editor is updated.
  pm.signal("commandsChanging");
  pm.commands = set.derive(pm.schema);
  pm.input.baseKeymap = deriveKeymap(pm);
  pm.commandKeys = Object.create(null);
  // :: () #path=ProseMirror#events#commandsChanged
  // Fired when the set of commands for the editor is updated.
  pm.signal("commandsChanged");
}

function markActive(pm, type) {
  var sel = pm.selection;
  if (sel.empty) return type.isInSet(pm.activeMarks());else return pm.doc.rangeHasMark(sel.from, sel.to, type);
}

function canAddInline(pm, type) {
  var _pm$selection = pm.selection;
  var from = _pm$selection.from;
  var to = _pm$selection.to;
  var empty = _pm$selection.empty;

  if (empty) return !type.isInSet(pm.activeMarks()) && pm.doc.path(from.path).type.canContainMark(type);
  var can = false;
  pm.doc.nodesBetween(from, to, function (node) {
    if (can || node.isTextblock && !node.type.canContainMark(type)) return false;
    if (node.isInline && !type.isInSet(node.marks)) can = true;
  });
  return can;
}

function markApplies(pm, type) {
  var _pm$selection2 = pm.selection;
  var from = _pm$selection2.from;
  var to = _pm$selection2.to;

  var relevant = false;
  pm.doc.nodesBetween(from, to, function (node) {
    if (node.isTextblock) {
      if (node.type.canContainMark(type)) relevant = true;
      return false;
    }
  });
  return relevant;
}

function selectedMarkAttr(pm, type, attr) {
  var _pm$selection3 = pm.selection;
  var from = _pm$selection3.from;
  var to = _pm$selection3.to;
  var empty = _pm$selection3.empty;

  var start = undefined,
      end = undefined;
  if (empty) {
    start = end = type.isInSet(pm.activeMarks());
  } else {
    var startParent = pm.doc.path(from.path);
    var startChunk = startParent.size > from.offset && startParent.chunkAfter(from.offset);
    start = startChunk ? type.isInSet(startChunk.node.marks) : null;
    end = type.isInSet(pm.doc.marksAt(to));
  }
  if (start && end && start.attrs[attr] == end.attrs[attr]) return start.attrs[attr];
}

function selectedNodeAttr(pm, type, name) {
  var node = pm.selection.node;

  if (node && node.type == type) return node.attrs[name];
}

function deriveParams(type, params) {
  return params && params.map(function (param) {
    var attr = type.attrs[param.attr];
    return {
      label: param.label,
      type: param.type || "text",
      "default": param["default"] || attr["default"],
      prefill: param.prefill || (type instanceof _model.NodeType ? function (pm) {
        return selectedNodeAttr(pm, this, param.attr);
      } : function (pm) {
        return selectedMarkAttr(pm, this, param.attr);
      })
    };
  });
}

function fillAttrs(conf, givenParams) {
  var attrs = conf.attrs;
  if (conf.params) {
    (function () {
      var filled = Object.create(null);
      if (attrs) for (var _name5 in attrs) {
        filled[_name5] = attrs[_name5];
      }conf.params.forEach(function (param, i) {
        return filled[param.attr] = givenParams[i];
      });
      attrs = filled;
    })();
  }
  return attrs;
}

_model.NodeType.deriveableCommands = Object.create(null);
_model.MarkType.deriveableCommands = Object.create(null);

_model.MarkType.deriveableCommands.set = function (conf) {
  return {
    run: function run(pm) {
      for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        params[_key - 1] = arguments[_key];
      }

      pm.setMark(this, true, fillAttrs(conf, params));
    },
    select: function select(pm) {
      return conf.inverseSelect ? markApplies(pm, this) && !markActive(pm, this) : canAddInline(pm, this);
    },
    params: deriveParams(this, conf.params)
  };
};

_model.MarkType.deriveableCommands.unset = function () {
  return {
    run: function run(pm) {
      pm.setMark(this, false);
    },
    select: function select(pm) {
      return markActive(pm, this);
    }
  };
};

_model.MarkType.deriveableCommands.toggle = function () {
  return {
    run: function run(pm) {
      pm.setMark(this, null);
    },
    active: function active(pm) {
      return markActive(pm, this);
    },
    select: function select(pm) {
      return markApplies(pm, this);
    }
  };
};

function isAtTopOfListItem(doc, from, to, listType) {
  return _model.Pos.samePath(from.path, to.path) && from.path.length >= 2 && from.path[from.path.length - 1] == 0 && listType.canContain(doc.path(from.path.slice(0, from.path.length - 1)));
}

_model.NodeType.deriveableCommands.wrap = function (conf) {
  return {
    run: function run(pm) {
      var _pm$selection4 = pm.selection;
      var from = _pm$selection4.from;
      var to = _pm$selection4.to;
      var head = _pm$selection4.head;var doJoin = false;
      if (conf.list && head && isAtTopOfListItem(pm.doc, from, to, this)) {
        // Don't do anything if this is the top of the list
        if (from.path[from.path.length - 2] == 0) return false;
        doJoin = true;
      }

      for (var _len2 = arguments.length, params = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        params[_key2 - 1] = arguments[_key2];
      }

      var tr = pm.tr.wrap(from, to, this, fillAttrs(conf, params));
      if (doJoin) tr.join(from.shorten(from.depth - 2));
      return tr.apply(pm.apply.scroll);
    },
    select: function select(pm) {
      var _pm$selection5 = pm.selection;
      var from = _pm$selection5.from;
      var to = _pm$selection5.to;
      var head = _pm$selection5.head;

      if (conf.list && head && isAtTopOfListItem(pm.doc, from, to, this) && from.path[from.path.length - 2] == 0) return false;
      return (0, _transform.canWrap)(pm.doc, from, to, this, conf.attrs);
    },
    params: deriveParams(this, conf.params)
  };
};

function alreadyHasBlockType(doc, from, to, type, attrs) {
  var found = false;
  if (!attrs) attrs = {};
  doc.nodesBetween(from, to || from, function (node) {
    if (node.isTextblock) {
      if (node.hasMarkup(type, attrs)) found = true;
      return false;
    }
  });
  return found;
}

_model.NodeType.deriveableCommands.make = function (conf) {
  return {
    run: function run(pm) {
      var _pm$selection6 = pm.selection;
      var from = _pm$selection6.from;
      var to = _pm$selection6.to;

      return pm.tr.setBlockType(from, to, this, conf.attrs).apply(pm.apply.scroll);
    },
    select: function select(pm) {
      var _pm$selection7 = pm.selection;
      var from = _pm$selection7.from;
      var to = _pm$selection7.to;
      var node = _pm$selection7.node;

      if (node) return node.isTextblock && !node.hasMarkup(this, conf.attrs);else return !alreadyHasBlockType(pm.doc, from, to, this, conf.attrs);
    }
  };
};

_model.NodeType.deriveableCommands.insert = function (conf) {
  return {
    run: function run(pm) {
      for (var _len3 = arguments.length, params = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        params[_key3 - 1] = arguments[_key3];
      }

      return pm.tr.replaceSelection(this.create(fillAttrs(conf, params))).apply(pm.apply.scroll);
    },
    select: this.isInline ? function (pm) {
      return pm.doc.path(pm.selection.from.path).type.canContainType(this);
    } : null,
    params: deriveParams(this, conf.params)
  };
};