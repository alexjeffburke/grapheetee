export const GRAPHQL_QUERY = "GRAPHQL_QUERY";
export const GRAPHQL_MUTATION = "GRAPHQL_MUTATION";

function validateQueryStructure(query, type) {
  const expectedOpener = type === GRAPHQL_MUTATION ? "mutation" : "query";
  let m;
  if ((m = query.match(/^[ \n]*(query|mutation) (?:[A-Za-z]+ )?{/))) {
    if (m[1] !== expectedOpener) {
      throw new Error(
        `GraqhQL body did not match action. Did you mean to call .${m[1]}()?`
      );
    }
  } else {
    throw new Error("Invalid query");
  }

  if (!query.match(/}[ \n]*$/)) {
    throw new Error("Invalid query");
  }
}

export default class GraphQlAction {
  constructor({ type, query, variables, collisionKey, uploads }) {
    if (!(type === GRAPHQL_QUERY || type === GRAPHQL_MUTATION)) {
      throw new Error("Invalid type");
    }

    if (typeof query === "string" && query.length > 0) {
      validateQueryStructure(query, type);
    } else {
      throw new Error("Missing query");
    }

    this.type = type;
    this.query = query;
    this.variables = variables;
    this.collisionKey = collisionKey || null;

    if (this.type === GRAPHQL_MUTATION) {
      this.uploads = uploads;
    }

    this.internal = {};
    this.internal.promise = new Promise((resolve, reject) => {
      this.internal.resolvePromise = resolve;
      this.internal.rejectPromise = reject;
    });
  }

  isQuery() {
    return this.type === GRAPHQL_QUERY;
  }

  isMutation() {
    return this.type === GRAPHQL_MUTATION;
  }

  resolve(value) {
    this.internal.resolvePromise(value);
  }

  reject(reason) {
    this.internal.rejectPromise(reason);
  }

  getPromise() {
    return this.internal.promise;
  }

  static query(query, opts) {
    return new GraphQlAction({ ...opts, type: GRAPHQL_QUERY, query });
  }

  static mutation(query, opts) {
    return new GraphQlAction({ ...opts, type: GRAPHQL_MUTATION, query });
  }
}
