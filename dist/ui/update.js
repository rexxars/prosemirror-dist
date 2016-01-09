"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MIN_FLUSH_DELAY = 200;
var UPDATE_TIMEOUT = 200;

// ;; Helper for scheduling updates whenever the state of the editor
// changes, in such a way that the amount of [layout
// reflows](http://eloquentjavascript.net/13_dom.html#p_nnTb9RktUT) is
// minimized, by syncronizing the updates with editor [flush
// events](#ProseMirror.flush).

var UpdateScheduler = (function () {
  // :: (ProseMirror, string, () -> ())
  // Creates an update scheduler for the given editor. `events` should
  // be a space-separated list of event names (for example
  // `"selectionChange change"`). Prepare should be a function that
  // _prepares_ an update. It should do any DOM measuring needed for
  // the update, and if DOM updates are needed, _return_ a function
  // that performs them. That way, if there are multiple components
  // that need to update, they can all do their measuring first, and
  // then, without triggering additional measuring, update the DOM.

  function UpdateScheduler(pm, events, prepare) {
    var _this = this;

    _classCallCheck(this, UpdateScheduler);

    this.pm = pm;
    this.prepare = prepare;

    this.mustUpdate = false;
    this.updateInfo = null;
    this.timeout = null;
    this.lastFlush = 0;

    this.events = events.split(" ");
    this.onEvent = this.onEvent.bind(this);
    this.force = this.force.bind(this);
    this.events.forEach(function (event) {
      return pm.on(event, _this.onEvent);
    });
    pm.on("flush", this.onFlush = this.onFlush.bind(this));
    pm.on("flushed", this.onFlushed = this.onFlushed.bind(this));
  }

  // :: ()
  // Detach the event handlers registered by this scheduler.

  _createClass(UpdateScheduler, [{
    key: "detach",
    value: function detach() {
      var _this2 = this;

      clearTimeout(this.timeout);
      this.events.forEach(function (event) {
        return _this2.pm.off(event, _this2.onEvent);
      });
      this.pm.off("flush", this.onFlush);
      this.pm.off("flushed", this.onFlushed);
    }
  }, {
    key: "onFlush",
    value: function onFlush() {
      var now = Date.now();
      if (this.mustUpdate && now - this.lastFlush >= MIN_FLUSH_DELAY) {
        this.lastFlush = now;
        clearTimeout(this.timeout);
        this.mustUpdate = false;
        this.update = this.prepare();
      }
    }
  }, {
    key: "onFlushed",
    value: function onFlushed() {
      if (this.update) {
        this.update();
        this.update = null;
      }
    }
  }, {
    key: "onEvent",
    value: function onEvent() {
      this.mustUpdate = true;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(this.force, UPDATE_TIMEOUT);
    }

    // :: ()
    // Force an update. Note that if the editor has scheduled a flush,
    // the update is still delayed until the flush occurs.
  }, {
    key: "force",
    value: function force() {
      if (this.pm.operation) {
        this.onEvent();
      } else {
        this.mustUpdate = false;
        this.updateInfo = null;
        this.lastFlush = Date.now();
        clearTimeout(this.timeout);
        var update = this.prepare();
        if (update) update();
      }
    }
  }]);

  return UpdateScheduler;
})();

exports.UpdateScheduler = UpdateScheduler;