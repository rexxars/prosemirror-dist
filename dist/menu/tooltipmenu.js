"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _model = require("../model");

var _edit = require("../edit");

var _dom = require("../dom");

var _uiTooltip = require("../ui/tooltip");

var _uiUpdate = require("../ui/update");

var _menu = require("./menu");

var classPrefix = "ProseMirror-tooltipmenu";

// :: union<bool, Object> #path=tooltipMenu #kind=option
//
// When given a truthy value, enables the tooltip menu module for this
// editor. This menu shows up when there is a selection, and
// optionally in certain other circumstances, providing
// context-relevant commands.
//
// By default, the tooltip will show inline menu commands (registered
// with the [`menuGroup`](#CommandSpec.menuGroup) command property)
// when there is an inline selection, and block related commands when
// there is a node selection on a block.
//
// The module can be configured by passing an object. These properties
// are recognized:
//
// **`showLinks`**`: bool = true`
//   : Causes a tooltip with the link target to show up when the
//     cursor is inside of a link (without a selection).
//
// **`selectedBlockMenu`**: bool = false`
//   : When enabled, and a whole block is selected or the cursor is
//     inside an empty block, the block menu gets shown.
//
// **`inlineGroups`**`: [string] = ["inline"]`
//   : The menu groups to show when displaying the menu for inline
//     content.
//
// **`inlineItems`**`: [union<string, [string]>]`
//   : Instead of using menu groups, this can be used to completely
//     override the set of commands shown for inline content. If
//     nested arrays are used, separators will be shown between items
//     from different arrays.
//
// **`blockGroups`**`: [string] = ["block"]`
//   : The menu groups to show when displaying the menu for block
//     content.
//
// **`blockItems`**`: [union<string, [string]>]`
//   : Overrides the commands shown for block content.

(0, _edit.defineOption)("tooltipMenu", false, function (pm, value) {
  if (pm.mod.tooltipMenu) pm.mod.tooltipMenu.detach();
  pm.mod.tooltipMenu = value ? new TooltipMenu(pm, value) : null;
});

function getItems(pm, items) {
  return Array.isArray(items) ? items.map(getItems.bind(null, pm)) : pm.commands[items];
}

var TooltipMenu = (function () {
  function TooltipMenu(pm, config) {
    var _this = this;

    _classCallCheck(this, TooltipMenu);

    this.pm = pm;
    this.config = config || {};

    this.showLinks = this.config.showLinks !== false;
    this.selectedBlockMenu = this.config.selectedBlockMenu;
    this.update = new _uiUpdate.UpdateScheduler(pm, "change selectionChange blur commandsChanged", function () {
      return _this.prepareUpdate();
    });
    this.onContextMenu = this.onContextMenu.bind(this);
    pm.content.addEventListener("contextmenu", this.onContextMenu);

    this.tooltip = new _uiTooltip.Tooltip(pm.wrapper, "above");
    this.menu = new _menu.Menu(pm, new _menu.TooltipDisplay(this.tooltip), function () {
      return _this.update.force();
    });
  }

  // Get the x and y coordinates at the top center of the current DOM selection.

  _createClass(TooltipMenu, [{
    key: "detach",
    value: function detach() {
      this.update.detach();
      this.tooltip.detach();
      this.pm.content.removeEventListener("contextmenu", this.onContextMenu);
    }
  }, {
    key: "items",
    value: function items(inline, block) {
      var items = undefined;
      if (!inline) items = [];else if (this.config.inlineItems) items = getItems(this.pm, this.config.inlineItems);else items = (0, _menu.menuGroups)(this.pm, this.config.inlineGroups || ["inline"]);

      if (block) {
        if (this.config.blockItems) addIfNew(items, getItems(this.pm, this.config.blockItems));else addIfNew(items, (0, _menu.menuGroups)(this.pm, this.config.blockGroups || ["block"]));
      }
      return items;
    }
  }, {
    key: "prepareUpdate",
    value: function prepareUpdate() {
      var _this2 = this;

      if (this.menu.active) return null;

      var _pm$selection = this.pm.selection;
      var empty = _pm$selection.empty;
      var node = _pm$selection.node;
      var from = _pm$selection.from;
      var to = _pm$selection.to;var link = undefined;
      if (!this.pm.hasFocus()) {
        return function () {
          return _this2.tooltip.close();
        };
      } else if (node && node.isBlock) {
        var _ret = (function () {
          var coords = topOfNodeSelection(_this2.pm);
          return {
            v: function () {
              return _this2.menu.show(_this2.items(false, true), coords);
            }
          };
        })();

        if (typeof _ret === "object") return _ret.v;
      } else if (!empty) {
        var _ret2 = (function () {
          var coords = node ? topOfNodeSelection(_this2.pm) : topCenterOfSelection();
          var showBlock = _this2.selectedBlockMenu && _model.Pos.samePath(from.path, to.path) && from.offset == 0 && to.offset == _this2.pm.doc.path(from.path).size;
          return {
            v: function () {
              return _this2.menu.show(_this2.items(true, showBlock), coords);
            }
          };
        })();

        if (typeof _ret2 === "object") return _ret2.v;
      } else if (this.selectedBlockMenu && this.pm.doc.path(from.path).size == 0) {
        var _ret3 = (function () {
          var coords = _this2.pm.coordsAtPos(from);
          return {
            v: function () {
              return _this2.menu.show(_this2.items(false, true), coords);
            }
          };
        })();

        if (typeof _ret3 === "object") return _ret3.v;
      } else if (this.showLinks && (link = this.linkUnderCursor())) {
        var _ret4 = (function () {
          var coords = _this2.pm.coordsAtPos(from);
          return {
            v: function () {
              return _this2.showLink(link, coords);
            }
          };
        })();

        if (typeof _ret4 === "object") return _ret4.v;
      } else {
        return function () {
          return _this2.tooltip.close();
        };
      }
    }
  }, {
    key: "linkUnderCursor",
    value: function linkUnderCursor() {
      var head = this.pm.selection.head;
      if (!head) return null;
      var marks = this.pm.doc.marksAt(head);
      return marks.reduce(function (found, m) {
        return found || m.type.name == "link" && m;
      }, null);
    }
  }, {
    key: "showLink",
    value: function showLink(link, pos) {
      var node = (0, _dom.elt)("div", { "class": classPrefix + "-linktext" }, (0, _dom.elt)("a", { href: link.attrs.href, title: link.attrs.title }, link.attrs.href));
      this.tooltip.open(node, pos);
    }
  }, {
    key: "onContextMenu",
    value: function onContextMenu(e) {
      var pos = this.pm.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos || !pos.isValid(this.pm.doc, true)) return;

      this.pm.setTextSelection(pos, pos);
      this.pm.flush();
      this.menu.show(this.items(true, false), topCenterOfSelection());
    }
  }]);

  return TooltipMenu;
})();

function topCenterOfSelection() {
  var rects = window.getSelection().getRangeAt(0).getClientRects();
  var _rects$0 = rects[0];
  var left = _rects$0.left;
  var right = _rects$0.right;
  var top = _rects$0.top;var i = 1;
  while (left == right && rects.length > i) {
    ;var _rects = rects[i++];
    left = _rects.left;
    right = _rects.right;
    top = _rects.top;
  }
  for (; i < rects.length; i++) {
    if (rects[i].top < rects[0].bottom - 1 && (
    // Chrome bug where bogus rectangles are inserted at span boundaries
    i == rects.length - 1 || Math.abs(rects[i + 1].left - rects[i].left) > 1)) {
      left = Math.min(left, rects[i].left);
      right = Math.max(right, rects[i].right);
      top = Math.min(top, rects[i].top);
    }
  }
  return { top: top, left: (left + right) / 2 };
}

function topOfNodeSelection(pm) {
  var selected = pm.content.querySelector(".ProseMirror-selectednode");
  if (!selected) return { left: 0, top: 0 };
  var box = selected.getBoundingClientRect();
  return { left: Math.min((box.left + box.right) / 2, box.left + 20), top: box.top };
}

function addIfNew(array, elts) {
  for (var i = 0; i < elts.length; i++) {
    if (array.indexOf(elts[i]) == -1) array.push(elts[i]);
  }
}

(0, _dom.insertCSS)("\n\n." + classPrefix + "-linktext a {\n  color: white;\n  text-decoration: none;\n  padding: 0 5px;\n}\n\n." + classPrefix + "-linktext a:hover {\n  text-decoration: underline;\n}\n\n");