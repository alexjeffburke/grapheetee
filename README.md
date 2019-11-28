# Grapheetee

This module is a clean fetch based GraphQL client.

# Usage

Once installed, the module exposes a constructor at the top-level
that is ready to be instantiated in the browser:

```js
import Grapheetee from "grapheetee";

const client = new Grapheetee({ url: "/api" });
```

Note that

### Node

Since the client is fetch based, those libraries must be added when
the module is used on node. This handled automatically by pulling in
the node version of the library as follows:

```js
const Grapheetee = require("grapheetee/node");

const instance = new Grapheetee({ url: "/my/internal/service" });
```

### Requests

Requests are made by calling the `query()` or `mutation()` method on
the client instance:

```js
instance.query({
  query: "...",
  valariables: {
    /* optional */
  }
});

instance.mutation({
  query: "...",
  valariables: {
    /* optional */
  },
  uploads: [
    /* optional */
  ]
});
```

## License

simple-search-language is licensed under a standard
3-clause BSD license -- see the `LICENSE`-file for details.

```

```
