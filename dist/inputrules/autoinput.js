"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _model = require("../model");

var _edit = require("../edit");

var _inputrules = require("./inputrules");

// :: Object<InputRule>
// Base set of input rules, enabled by default when `autoInput` is set
// to `true`.
var autoInputRules = Object.create(null);

exports.autoInputRules = autoInputRules;
// :: union<bool, [union<InputRule, string, Object<?InputRule>>]> #path=autoInput #kind=option
// Controls the [input rules](#InputRule) initially active in the
// editor. Pass an array of sources, which can be either an input
// rule, the string `"schema"`, to add rules
// [registered](#SchemaItem.register) on the schema items (under the
// string `"autoInput"`), or an object containing input rules. To
// remove previously included rules, you can add an object that maps
// their name to `null`.
//
// The value `false` (the default) is a shorthand for no input rules,
// and the value `true` for `["schema", autoInputRules]`.
(0, _edit.defineOption)("autoInput", false, function (pm, val) {
  if (pm.mod.autoInput) {
    pm.mod.autoInput.forEach(function (name) {
      return (0, _inputrules.removeInputRule)(pm, name);
    });
    pm.mod.autoInput = null;
  }
  if (val) {
    (function () {
      if (val === true) val = ["schema", autoInputRules];
      var rules = Object.create(null),
          list = pm.mod.autoInput = [];
      val.forEach(function (spec) {
        if (spec === "schema") {
          pm.schema.registry("autoInput", function (rule, type, name) {
            var rname = name + ":" + rule.name,
                handler = rule.handler;
            if (handler.bind) handler = handler.bind(type);
            rules[rname] = new _inputrules.InputRule(rname, rule.match, rule.filter, handler);
          });
        } else if (spec instanceof _inputrules.InputRule) {
          rules[spec.name] = spec;
        } else {
          for (var _name in spec) {
            var _val = spec[_name];
            if (_val == null) delete rules[_name];else rules[_name] = _val;
          }
        }
      });
      for (var _name2 in rules) {
        (0, _inputrules.addInputRule)(pm, rules[_name2]);
        list.push(rules[_name2].name);
      }
    })();
  }
});

autoInputRules.emDash = new _inputrules.InputRule("emDash", /--$/, "-", "—");

autoInputRules.openDoubleQuote = new _inputrules.InputRule("openDoubleQuote", /\s(")$/, '"', "“");

autoInputRules.closeDoubleQuote = new _inputrules.InputRule("closeDoubleQuote", /"$/, '"', "”");

autoInputRules.openSingleQuote = new _inputrules.InputRule("openSingleQuote", /\s(')$/, "'", "‘");

autoInputRules.closeSingleQuote = new _inputrules.InputRule("closeSingleQuote", /'$/, "'", "’");

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