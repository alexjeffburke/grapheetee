export const GRAPHQL_QUERY = "GRAPHQL_QUERY";
export const GRAPHQL_MUTATION = "GRAPHQL_MUTATION";

export default class GraphQlAction {
  constructor({ type, query, variables, collisionKey, uploads }) {
    if (!(type === GRAPHQL_QUERY || type === GRAPHQL_MUTATION)) {
      throw new Error("Invalid type");
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

  static query(opts) {
    return new GraphQlAction({ ...opts, type: GRAPHQL_QUERY });
  }

  static mutation(opts) {
    return new GraphQlAction({ ...opts, type: GRAPHQL_MUTATION });
  }
}
