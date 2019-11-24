import expect from "unexpected";

import GraphQlAction, {
  GRAPHQL_QUERY,
  GRAPHQL_MUTATION
} from "../lib/GraphQlAction";

describe("GraphQlAction", () => {
  it("should export a function", () => {
    expect(GraphQlAction, "to be a function");
  });

  it("should throw when no type is set a function", () => {
    expect(
      () => {
        new GraphQlAction({ type: null });
      },
      "to throw",
      "Invalid type"
    );
  });

  it("should create a query as an instance of GraphQlAction", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_QUERY,
      query: "query {}"
    });
    expect(action, "to be a", GraphQlAction);
  });

  it("should return false from isMutation", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_QUERY,
      query: "query {}"
    });
    expect(action.isMutation(), "to be false");
  });

  it("should return true from isQuery", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_QUERY,
      query: "query {}"
    });
    expect(action.isQuery(), "to be true");
  });

  it("should create a mutation as an instance of GraphQlAction", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_MUTATION,
      query: "mutation {}"
    });
    expect(action, "to be a", GraphQlAction);
  });

  it("should return true from isMutation", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_MUTATION,
      query: "mutation {}"
    });
    expect(action.isMutation(), "to be true");
  });

  it("should return false from isQuery", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_MUTATION,
      query: "mutation {}"
    });
    expect(action.isQuery(), "to be false");
  });

  it("should be able to resolve a returned promise", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_QUERY,
      query: "query {}"
    });
    const promise = action.getPromise();

    action.resolve("foo");

    return expect(promise, "when fulfilled", "to equal", "foo");
  });

  it("should be able to reject a returned promise", () => {
    const action = new GraphQlAction({
      type: GRAPHQL_QUERY,
      query: "query {}"
    });
    const promise = action.getPromise();

    action.reject("foo");

    return expect(promise, "when rejected", "to equal", "foo");
  });

  describe("query()", () => {
    it("should have a static method for creating a query", () => {
      expect(GraphQlAction.query, "to be a function");
    });

    it("should create a query as an instance of GraphQlAction", () => {
      const action = GraphQlAction.query("query {}");
      expect(action, "to be a", GraphQlAction);
    });

    it("should create a query", () => {
      const payload = "query { error }";
      const action = GraphQlAction.query(payload);
      expect(action, "to satisfy", {
        type: GRAPHQL_QUERY,
        query: payload
      });
    });
  });

  describe("mutation()", () => {
    it("should have a static method for creating a mutation", () => {
      expect(GraphQlAction.mutation, "to be a function");
    });

    it("should create a mutation as an instance of GraphQlAction", () => {
      const action = GraphQlAction.mutation("mutation {}");
      expect(action, "to be a", GraphQlAction);
    });

    it("should create a mutation", () => {
      const payload = "mutation { error }";
      const action = GraphQlAction.mutation(payload);
      expect(action, "to satisfy", {
        type: GRAPHQL_MUTATION,
        query: payload
      });
    });
  });

  describe("when validating the GraphQL payload", () => {
    it("should throw on type mismatch (query)", () => {
      expect(
        () => {
          GraphQlAction.mutation("query {}");
        },
        "to throw",
        "GraqhQL body did not match action. Did you mean to call .query()?"
      );
    });

    it("should throw on type mismatch (mutation)", () => {
      expect(
        () => {
          GraphQlAction.query("mutation {}");
        },
        "to throw",
        "GraqhQL body did not match action. Did you mean to call .mutation()?"
      );
    });

    it("should permit a name on the query", () => {
      expect(() => {
        GraphQlAction.query("query Foo {}");
      }, "not to throw");
    });

    it("should permit any amount of leading and trailing whitespace", () => {
      expect(() => {
        GraphQlAction.query("\n  \n  \n query Foo {}\n   \n   \n");
      }, "not to throw");
    });
  });
});
