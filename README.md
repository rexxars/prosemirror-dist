# prosemirror-dist

**Temporary**, pre-built, dist-version of ProseMirror. Released ~daily if there has been changes in upstream repo. The release process is automated, so regardless of breaking changes, the major version will be bumped. Version your dependency accordingly.

**Note**: The package *will* be removed from NPM once ProseMirror has an official, pre-built version available on NPM.

## Installation

```
npm install --save @rexxars/prosemirror-dist
```

## Usage

See [ProseMirror](http://prosemirror.net/) for documentation.

When you see `require`/`import` calls to `prosemirror`, simply replace them with `@rexxars/prosemirror-dist`. For instance:

```js
// Instead of:
var edit = require("prosemirror/dist/edit")

// Put:
var edit = require("@rexxars/prosemirror-dist/dist/edit")
```

Or in ES6:
```js
// Instead of:
import {ProseMirror} from "prosemirror/dist/edit"

// Put:
import {ProseMirror} from "@rexxars/prosemirror-dist/dist/edit"
```
