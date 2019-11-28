# Grapheetee

This module is a clean fetch based GraphQL client.

# Usage

Once installed, the module exposes a constructor at the top-level
that is ready to be instantiated in the browser:

```js
import Grapheetee from "grapheetee";

const client = new Grapheetee({ url: "/api" });
```

Note that a base `url` must be supplied as an option to the constructor.

### Node

Since the client is fetch based, libraries that provide these interfaces
must be provided when the module is used on node. These details are handled
automatically by providing a node ready version of the library:

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

grapheetee is licensed under a standard 3-clause BSD
license -- see the `LICENSE`-file for details.
