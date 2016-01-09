"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _edit = require("../edit");

var _dom = require("../dom");

var _uiUpdate = require("../ui/update");

var _menu = require("./menu");

var prefix = "ProseMirror-menubar";

// :: union<bool, Object> #path=menuBar #kind=option
//
// When given a truthy value, enables the menu bar module for this
// editor. The menu bar takes up space above the editor, showing
// currently available commands (that have been
// [added](#CommandSpec.menuGroup) to the menu). To configure the
// module, you can pass a configuration object, on which the following
// properties are supported:
//
// **`float`**`: bool = false`
//   : When enabled, causes the menu bar to stay visible when the
//     editor is partially scrolled out of view, by making it float at
//     the top of the viewport.
//
// **`groups`**`: [string] = ["inline", "block", "history"]`
//   : Determines the menu groups that are shown in the menu bar.
//
// **`items`**`: [union<string, [string]>]`
//   : Can be used to, rather than getting the commands to display
//     from menu groups, explicitly provide the full list of commands.
//     If nested arrays are used, separators will be shown between
//     items from different arrays.

(0, _edit.defineOption)("menuBar", false, function (pm, value) {
  if (pm.mod.menuBar) pm.mod.menuBar.detach();
  pm.mod.menuBar = value ? new MenuBar(pm, value) : null;
});

function getItems(pm, items) {
  return Array.isArray(items) ? items.map(getItems.bind(null, pm)) : pm.commands[items];
}

var BarDisplay = (function () {
  function BarDisplay(container) {
    _classCallCheck(this, BarDisplay);

    this.container = container;
  }

  _createClass(BarDisplay, [{
    key: "clear",
    value: function clear() {
      this.container.textContent = "";
    }
  }, {
    key: "show",
    value: function show(dom) {
      this.clear();
      this.container.appendChild(dom);
    }
  }, {
    key: "enter",
    value: function enter(dom, back) {
      var current = this.container.firstChild;
      if (current) {
        current.style.position = "absolute";
        current.style.opacity = "0.5";
      }
      var backButton = (0, _dom.elt)("div", { "class": prefix + "-back" });
      backButton.addEventListener("mousedown", function (e) {
        e.preventDefault();e.stopPropagation();
        back();
      });
      var added = (0, _dom.elt)("div", { "class": prefix + "-sliding" }, backButton, dom);
      this.container.appendChild(added);
      added.getBoundingClientRect(); // Force layout for transition
      added.style.left = "0";
      added.addEventListener("transitionend", function () {
        if (current && current.parentNode) current.parentNode.removeChild(current);
      });
    }
  }]);

  return BarDisplay;
})();

var MenuBar = (function () {
  function MenuBar(pm, config) {
    var _this = this;

    _classCallCheck(this, MenuBar);

    this.pm = pm;
    this.config = config || {};

    this.menuElt = (0, _dom.elt)("div", { "class": prefix + "-inner" });
    this.wrapper = (0, _dom.elt)("div", { "class": prefix },
    // Dummy structure to reserve space for the menu
    (0, _dom.elt)("div", { "class": "ProseMirror-menu", style: "visibility: hidden" }, (0, _dom.elt)("span", { "class": "ProseMirror-menuicon" }, (0, _dom.elt)("div", { "class": "ProseMirror-icon" }, "x"))), this.menuElt);
    pm.wrapper.insertBefore(this.wrapper, pm.wrapper.firstChild);

    this.update = new _uiUpdate.UpdateScheduler(pm, "selectionChange change activeMarkChange commandsChanged", function () {
      return _this.prepareUpdate();
    });
    this.menu = new _menu.Menu(pm, new BarDisplay(this.menuElt), function () {
      return _this.resetMenu();
    });

    this.update.force();

    this.floating = false;
    if (this.config.float) {
      this.updateFloat();
      this.scrollFunc = function () {
        if (!document.body.contains(_this.pm.wrapper)) window.removeEventListener("scroll", _this.scrollFunc);else _this.updateFloat();
      };
      window.addEventListener("scroll", this.scrollFunc);
    }
  }

  _createClass(MenuBar, [{
    key: "detach",
    value: function detach() {
      this.update.detach();
      this.wrapper.parentNode.removeChild(this.wrapper);

      if (this.scrollFunc) window.removeEventListener("scroll", this.scrollFunc);
    }
  }, {
    key: "prepareUpdate",
    value: function prepareUpdate() {
      var _this2 = this;

      var scrollCursor = this.prepareScrollCursor();
      return function () {
        if (!_this2.menu.active) _this2.resetMenu();
        if (scrollCursor) scrollCursor();
      };
    }
  }, {
    key: "resetMenu",
    value: function resetMenu() {
      this.menu.show(this.config.items ? getItems(this.pm, this.config.items) : (0, _menu.menuGroups)(this.pm, this.config.groups || ["inline", "block", "history"]));
    }
  }, {
    key: "updateFloat",
    value: function updateFloat() {
      var editorRect = this.pm.wrapper.getBoundingClientRect();
      if (this.floating) {
        if (editorRect.top >= 0 || editorRect.bottom < this.menuElt.offsetHeight + 10) {
          this.floating = false;
          this.menuElt.style.position = this.menuElt.style.left = this.menuElt.style.width = "";
          this.menuElt.style.display = "";
        } else {
          var border = (this.pm.wrapper.offsetWidth - this.pm.wrapper.clientWidth) / 2;
          this.menuElt.style.left = editorRect.left + border + "px";
          this.menuElt.style.display = editorRect.top > window.innerHeight ? "none" : "";
        }
      } else {
        if (editorRect.top < 0 && editorRect.bottom >= this.menuElt.offsetHeight + 10) {
          this.floating = true;
          var menuRect = this.menuElt.getBoundingClientRect();
          this.menuElt.style.left = menuRect.left + "px";
          this.menuElt.style.width = menuRect.width + "px";
          this.menuElt.style.position = "fixed";
        }
      }
    }
  }, {
    key: "prepareScrollCursor",
    value: function prepareScrollCursor() {
      var _this3 = this;

      if (!this.floating) return null;
      var head = this.pm.selection.head;
      if (!head) return null;
      var cursorPos = this.pm.coordsAtPos(head);
      var menuRect = this.menuElt.getBoundingClientRect();
      if (cursorPos.top < menuRect.bottom && cursorPos.bottom > menuRect.top) {
        var _ret = (function () {
          var scrollable = findWrappingScrollable(_this3.pm.wrapper);
          if (scrollable) return {
              v: function () {
                return scrollable.scrollTop -= menuRect.bottom - cursorPos.top;
              }
            };
        })();

        if (typeof _ret === "object") return _ret.v;
      }
    }
  }]);

  return MenuBar;
})();

function findWrappingScrollable(node) {
  for (var cur = node.parentNode; cur; cur = cur.parentNode) {
    if (cur.scrollHeight > cur.clientHeight) return cur;
  }
}

(0, _dom.insertCSS)("\n." + prefix + " {\n  position: relative;\n  margin-bottom: 3px;\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n}\n\n." + prefix + "-inner {\n  min-height: 1em;\n  color: #666;\n  padding: 1px 6px;\n  top: 0; left: 0; right: 0;\n  position: absolute;\n  border-bottom: 1px solid silver;\n  background: white;\n  z-index: 10;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  overflow: hidden;\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n}\n\n." + prefix + " .ProseMirror-icon-active {\n  background: #eee;\n}\n\n." + prefix + " input[type=\"text\"],\n." + prefix + " textarea {\n  background: #eee;\n  color: black;\n  border: none;\n  outline: none;\n  width: 100%;\n  box-sizing: -moz-border-box;\n  box-sizing: border-box;\n}\n\n." + prefix + " input[type=\"text\"] {\n  padding: 0 4px;\n}\n\n." + prefix + " form {\n  position: relative;\n  padding: 2px 4px;\n}\n\n." + prefix + " .ProseMirror-blocktype {\n  border: 1px solid #ccc;\n  min-width: 4em;\n}\n." + prefix + " .ProseMirror-blocktype:after {\n  color: #ccc;\n}\n\n." + prefix + "-sliding {\n  -webkit-transition: left 0.2s ease-out;\n  -moz-transition: left 0.2s ease-out;\n  transition: left 0.2s ease-out;\n  position: relative;\n  left: 100%;\n  width: 100%;\n  box-sizing: -moz-border-box;\n  box-sizing: border-box;\n  padding-left: 16px;\n  background: white;\n}\n\n." + prefix + "-back {\n  position: absolute;\n  height: 100%;\n  margin-top: -1px;\n  padding-bottom: 2px;\n  width: 10px;\n  left: 0;\n  border-right: 1px solid silver;\n  cursor: pointer;\n}\n." + prefix + "-back:after {\n  content: \"«\";\n}\n\n");