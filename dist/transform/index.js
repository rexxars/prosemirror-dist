"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("./mark");

require("./split");

require("./replace");

// !! This module defines a way to transform documents. Transforming
// happens in `Step`s, which are atomic, well-defined modifications to
// a document. [Applying](`Step.apply`) a step produces a new document
// and a [position map](#PosMap) that maps positions in the old
// document to position in the new document. Steps can be
// [inverted](#Step.invert) to create a step that undoes their effect,
// and chained together in a convenience object called a `Transform`.
//
// This module does not depend on the browser API being available
// (i.e. you can load it into any JavaScript environment).
//
// These are the types of steps defined:
var _transform = require("./transform");

Object.defineProperty(exports, "Transform", {
  enumerable: true,
  get: function get() {
    return _transform.Transform;
  }
});

var _step = require("./step");

Object.defineProperty(exports, "Step", {
  enumerable: true,
  get: function get() {
    return _step.Step;
  }
});
Object.defineProperty(exports, "StepResult", {
  enumerable: true,
  get: function get() {
    return _step.StepResult;
  }
});

var _ancestor = require("./ancestor");

Object.defineProperty(exports, "canLift", {
  enumerable: true,
  get: function get() {
    return _ancestor.canLift;
  }
});
Object.defineProperty(exports, "canWrap", {
  enumerable: true,
  get: function get() {
    return _ancestor.canWrap;
  }
});

var _join = require("./join");

Object.defineProperty(exports, "joinPoint", {
  enumerable: true,
  get: function get() {
    return _join.joinPoint;
  }
});
Object.defineProperty(exports, "joinableBlocks", {
  enumerable: true,
  get: function get() {
    return _join.joinableBlocks;
  }
});

var _map = require("./map");

Object.defineProperty(exports, "PosMap", {
  enumerable: true,
  get: function get() {
    return _map.PosMap;
  }
});
Object.defineProperty(exports, "MapResult", {
  enumerable: true,
  get: function get() {
    return _map.MapResult;
  }
});
Object.defineProperty(exports, "Remapping", {
  enumerable: true,
  get: function get() {
    return _map.Remapping;
  }
});