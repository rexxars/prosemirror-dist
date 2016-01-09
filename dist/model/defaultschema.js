"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _schema = require("./schema");

// ;; The default top-level document node type.

var Doc = (function (_Block) {
  _inherits(Doc, _Block);

  function Doc() {
    _classCallCheck(this, Doc);

    _get(Object.getPrototypeOf(Doc.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default blockquote node type.

  _createClass(Doc, null, [{
    key: "kinds",
    get: function get() {
      return "doc";
    }
  }]);

  return Doc;
})(_schema.Block);

exports.Doc = Doc;

var BlockQuote = (function (_Block2) {
  _inherits(BlockQuote, _Block2);

  function BlockQuote() {
    _classCallCheck(this, BlockQuote);

    _get(Object.getPrototypeOf(BlockQuote.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default ordered list node type. Has a single attribute,
  // `order`, which determines the number at which the list starts
  // counting, and defaults to 1.
  return BlockQuote;
})(_schema.Block);

exports.BlockQuote = BlockQuote;

var OrderedList = (function (_Block3) {
  _inherits(OrderedList, _Block3);

  function OrderedList() {
    _classCallCheck(this, OrderedList);

    _get(Object.getPrototypeOf(OrderedList.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default bullet list node type.

  _createClass(OrderedList, [{
    key: "contains",
    get: function get() {
      return "list_item";
    }
  }, {
    key: "attrs",
    get: function get() {
      return { order: new _schema.Attribute({ "default": "1" }) };
    }
  }]);

  return OrderedList;
})(_schema.Block);

exports.OrderedList = OrderedList;

var BulletList = (function (_Block4) {
  _inherits(BulletList, _Block4);

  function BulletList() {
    _classCallCheck(this, BulletList);

    _get(Object.getPrototypeOf(BulletList.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default list item node type.

  _createClass(BulletList, [{
    key: "contains",
    get: function get() {
      return "list_item";
    }
  }]);

  return BulletList;
})(_schema.Block);

exports.BulletList = BulletList;

var ListItem = (function (_Block5) {
  _inherits(ListItem, _Block5);

  function ListItem() {
    _classCallCheck(this, ListItem);

    _get(Object.getPrototypeOf(ListItem.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default horizontal rule node type.

  _createClass(ListItem, null, [{
    key: "kinds",
    get: function get() {
      return "list_item";
    }
  }]);

  return ListItem;
})(_schema.Block);

exports.ListItem = ListItem;

var HorizontalRule = (function (_Block6) {
  _inherits(HorizontalRule, _Block6);

  function HorizontalRule() {
    _classCallCheck(this, HorizontalRule);

    _get(Object.getPrototypeOf(HorizontalRule.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default heading node type. Has a single attribute
  // `level`, which indicates the heading level, and defaults to 1.

  _createClass(HorizontalRule, [{
    key: "contains",
    get: function get() {
      return null;
    }
  }]);

  return HorizontalRule;
})(_schema.Block);

exports.HorizontalRule = HorizontalRule;

var Heading = (function (_Textblock) {
  _inherits(Heading, _Textblock);

  function Heading() {
    _classCallCheck(this, Heading);

    _get(Object.getPrototypeOf(Heading.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default code block / listing node type. Only
  // allows unmarked text nodes inside of it.

  _createClass(Heading, [{
    key: "attrs",
    get: function get() {
      return { level: new _schema.Attribute({ "default": "1" }) };
    }
  }]);

  return Heading;
})(_schema.Textblock);

exports.Heading = Heading;

var CodeBlock = (function (_Textblock2) {
  _inherits(CodeBlock, _Textblock2);

  function CodeBlock() {
    _classCallCheck(this, CodeBlock);

    _get(Object.getPrototypeOf(CodeBlock.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default paragraph node type.

  _createClass(CodeBlock, [{
    key: "contains",
    get: function get() {
      return "text";
    }
  }, {
    key: "containsMarks",
    get: function get() {
      return false;
    }
  }, {
    key: "isCode",
    get: function get() {
      return true;
    }
  }]);

  return CodeBlock;
})(_schema.Textblock);

exports.CodeBlock = CodeBlock;

var Paragraph = (function (_Textblock3) {
  _inherits(Paragraph, _Textblock3);

  function Paragraph() {
    _classCallCheck(this, Paragraph);

    _get(Object.getPrototypeOf(Paragraph.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default inline image node type. Has these
  // attributes:
  //
  // - **`src`** (required): The URL of the image.
  // - **`alt`**: The alt text.
  // - **`title`**: The title of the image.

  _createClass(Paragraph, [{
    key: "defaultTextblock",
    get: function get() {
      return true;
    }
  }]);

  return Paragraph;
})(_schema.Textblock);

exports.Paragraph = Paragraph;

var Image = (function (_Inline) {
  _inherits(Image, _Inline);

  function Image() {
    _classCallCheck(this, Image);

    _get(Object.getPrototypeOf(Image.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default hard break node type.

  _createClass(Image, [{
    key: "attrs",
    get: function get() {
      return {
        src: new _schema.Attribute(),
        alt: new _schema.Attribute({ "default": "" }),
        title: new _schema.Attribute({ "default": "" })
      };
    }
  }]);

  return Image;
})(_schema.Inline);

exports.Image = Image;

var HardBreak = (function (_Inline2) {
  _inherits(HardBreak, _Inline2);

  function HardBreak() {
    _classCallCheck(this, HardBreak);

    _get(Object.getPrototypeOf(HardBreak.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default emphasis mark type.

  _createClass(HardBreak, [{
    key: "selectable",
    get: function get() {
      return false;
    }
  }, {
    key: "isBR",
    get: function get() {
      return true;
    }
  }]);

  return HardBreak;
})(_schema.Inline);

exports.HardBreak = HardBreak;

var EmMark = (function (_MarkType) {
  _inherits(EmMark, _MarkType);

  function EmMark() {
    _classCallCheck(this, EmMark);

    _get(Object.getPrototypeOf(EmMark.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default strong mark type.

  _createClass(EmMark, null, [{
    key: "rank",
    get: function get() {
      return 51;
    }
  }]);

  return EmMark;
})(_schema.MarkType);

exports.EmMark = EmMark;

var StrongMark = (function (_MarkType2) {
  _inherits(StrongMark, _MarkType2);

  function StrongMark() {
    _classCallCheck(this, StrongMark);

    _get(Object.getPrototypeOf(StrongMark.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default link mark type. Has these attributes:
  //
  // - **`href`** (required): The link target.
  // - **`title`**: The link's title.

  _createClass(StrongMark, null, [{
    key: "rank",
    get: function get() {
      return 52;
    }
  }]);

  return StrongMark;
})(_schema.MarkType);

exports.StrongMark = StrongMark;

var LinkMark = (function (_MarkType3) {
  _inherits(LinkMark, _MarkType3);

  function LinkMark() {
    _classCallCheck(this, LinkMark);

    _get(Object.getPrototypeOf(LinkMark.prototype), "constructor", this).apply(this, arguments);
  }

  // ;; The default code font mark type.

  _createClass(LinkMark, [{
    key: "attrs",
    get: function get() {
      return {
        href: new _schema.Attribute(),
        title: new _schema.Attribute({ "default": "" })
      };
    }
  }], [{
    key: "rank",
    get: function get() {
      return 53;
    }
  }]);

  return LinkMark;
})(_schema.MarkType);

exports.LinkMark = LinkMark;

var CodeMark = (function (_MarkType4) {
  _inherits(CodeMark, _MarkType4);

  function CodeMark() {
    _classCallCheck(this, CodeMark);

    _get(Object.getPrototypeOf(CodeMark.prototype), "constructor", this).apply(this, arguments);
  }

  // :: SchemaSpec
  // The specification for the default schema.

  _createClass(CodeMark, [{
    key: "isCode",
    get: function get() {
      return true;
    }
  }], [{
    key: "rank",
    get: function get() {
      return 101;
    }
  }]);

  return CodeMark;
})(_schema.MarkType);

exports.CodeMark = CodeMark;
var defaultSpec = new _schema.SchemaSpec({
  doc: Doc,
  blockquote: BlockQuote,
  ordered_list: OrderedList,
  bullet_list: BulletList,
  list_item: ListItem,
  horizontal_rule: HorizontalRule,

  paragraph: Paragraph,
  heading: Heading,
  code_block: CodeBlock,

  text: _schema.Text,
  image: Image,
  hard_break: HardBreak
}, {
  em: EmMark,
  strong: StrongMark,
  link: LinkMark,
  code: CodeMark
});

// :: Schema
// ProseMirror's default document schema.
var defaultSchema = new _schema.Schema(defaultSpec);
exports.defaultSchema = defaultSchema;