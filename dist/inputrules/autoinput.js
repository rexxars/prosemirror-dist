"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defineInputRule = defineInputRule;

var _model = require("../model");

var _edit = require("../edit");

var _inputrules = require("./inputrules");

// :: bool #path=autoInput #kind=option
// When set to true, enables the input rules defined by `defineInputRule` and stored under the
// `"autoInput"` name in the editor schema's
// [`registry`](#Schema.registry)—by default, these are things
// like smart quotes, and automatically wrapping a block in a list if
// you start it with `"1. "`.
(0, _edit.defineOption)("autoInput", false, function (pm, val) {
  if (pm.mod.autoInput) {
    pm.mod.autoInput.forEach(function (name) {
      return (0, _inputrules.removeInputRule)(pm, name);
    });
    pm.mod.autoInput = null;
  }
  if (val) {
    pm.mod.autoInput = [];
    pm.schema.registry("autoInput", function (rule, type, name) {
      var rname = name + ":" + rule.name,
          handler = rule.handler;
      if (handler.bind) handler = handler.bind(type);
      (0, _inputrules.addInputRule)(pm, new _inputrules.InputRule(rname, rule.match, rule.filter, handler));
      pm.mod.autoInput.push(rname);
    });
    for (var _name in rules) {
      var rule = rules[_name];
      (0, _inputrules.addInputRule)(pm, rule);
      pm.mod.autoInput.push(rule.name);
    }
  }
});

var rules = Object.create(null);

// :: (InputRule)
// Define an input rule to be used when the `autoInput` option is enabled.

function defineInputRule(rule) {
  rules[rule.name] = rule;
}

defineInputRule(new _inputrules.InputRule("emDash", /--$/, "-", "—"));

defineInputRule(new _inputrules.InputRule("openDoubleQuote", /\s(")$/, '"', "“"));

defineInputRule(new _inputrules.InputRule("closeDoubleQuote", /"$/, '"', "”"));

defineInputRule(new _inputrules.InputRule("openSingleQuote", /\s(')$/, "'", "‘"));

defineInputRule(new _inputrules.InputRule("closeSingleQuote", /'$/, "'", "’"));

_model.BlockQuote.register("autoInput", new _inputrules.InputRule("startBlockQuote", /^\s*> $/, " ", function (pm, _, pos) {
  wrapAndJoin(pm, pos, this);
}));

_model.OrderedList.register("autoInput", new _inputrules.InputRule("startOrderedList", /^(\d+)\. $/, " ", function (pm, match, pos) {
  var order = +match[1];
  wrapAndJoin(pm, pos, this, { order: order || null }, function (node) {
    return node.size + (node.attrs.order || 1) == order;
  });
}));

_model.BulletList.register("autoInput", new _inputrules.InputRule("startBulletList", /^\s*([-+*]) $/, " ", function (pm, match, pos) {
  var bullet = match[1];
  wrapAndJoin(pm, pos, this, null, function (node) {
    return node.attrs.bullet == bullet;
  });
}));

_model.CodeBlock.register("autoInput", new _inputrules.InputRule("startCodeBlock", /^```$/, "`", function (pm, _, pos) {
  setAs(pm, pos, this, { params: "" });
}));

_model.Heading.register("autoInput", new _inputrules.InputRule("startHeading", /^(#{1,6}) $/, " ", function (pm, match, pos) {
  setAs(pm, pos, this, { level: match[1].length });
}));

function wrapAndJoin(pm, pos, type) {
  var attrs = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
  var predicate = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

  var before = pos.shorten();
  var sibling = before.offset > 0 && pm.doc.path(before.path).child(before.offset - 1);
  var join = sibling && sibling.type.name == type && (!predicate || predicate(sibling));
  var tr = pm.tr.wrap(pos, pos, type, attrs);
  var delPos = tr.map(pos).pos;
  tr["delete"](new _model.Pos(delPos.path, 0), delPos);
  if (join) tr.join(before);
  tr.apply();
}

function setAs(pm, pos, type, attrs) {
  pm.tr.setBlockType(pos, pos, type, attrs)["delete"](new _model.Pos(pos.path, 0), pos).apply();
}