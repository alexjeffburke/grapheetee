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
    const action = new GraphQlAction({ type: GRAPHQL_QUERY });
    expect(action, "to be a", GraphQlAction);
  });

  it("should return false from isMutation", () => {
    const action = new GraphQlAction({ type: GRAPHQL_QUERY });
    expect(action.isMutation(), "to be false");
  });

  it("should return true from isQuery", () => {
    const action = new GraphQlAction({ type: GRAPHQL_QUERY });
    expect(action.isQuery(), "to be true");
  });

  it("should create a mutation as an instance of GraphQlAction", () => {
    const action = new GraphQlAction({ type: GRAPHQL_MUTATION });
    expect(action, "to be a", GraphQlAction);
  });

  it("should return true from isMutation", () => {
    const action = new GraphQlAction({ type: GRAPHQL_MUTATION });
    expect(action.isMutation(), "to be true");
  });

  it("should return false from isQuery", () => {
    const action = new GraphQlAction({ type: GRAPHQL_MUTATION });
    expect(action.isQuery(), "to be false");
  });

  it("should be able to resolve a returned promise", () => {
    const action = new GraphQlAction({ type: GRAPHQL_QUERY });
    const promise = action.getPromise();

    action.resolve("foo");

    return expect(promise, "when fulfilled", "to equal", "foo");
  });

  it("should be able to reject a returned promise", () => {
    const action = new GraphQlAction({ type: GRAPHQL_QUERY });
    const promise = action.getPromise();

    action.reject("foo");

    return expect(promise, "when rejected", "to equal", "foo");
  });

  describe("query()", () => {
    it("should have a static method for creating a query", () => {
      expect(GraphQlAction.query, "to be a function");
    });

    it("should create a query as an instance of GraphQlAction", () => {
      const action = GraphQlAction.query();
      expect(action, "to be a", GraphQlAction);
    });

    it("should create a query", () => {
      const action = GraphQlAction.query();
      expect(action, "to satisfy", {
        type: GRAPHQL_QUERY
      });
    });
  });

  describe("mutation()", () => {
    it("should have a static method for creating a mutation", () => {
      expect(GraphQlAction.mutation, "to be a function");
    });

    it("should create a mutation as an instance of GraphQlAction", () => {
      const action = GraphQlAction.mutation();
      expect(action, "to be a", GraphQlAction);
    });

    it("should create a mutation", () => {
      const action = GraphQlAction.mutation();
      expect(action, "to satisfy", {
        type: GRAPHQL_MUTATION
      });
    });
  });
});
