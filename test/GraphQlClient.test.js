import expect from "unexpected";

import GraphQlClient from "../lib/GraphQlClient";

const createMockActionExecutor = () => {
  const actionExecutor = {
    queue: [],
    execute: action => {
      actionExecutor.queue.push(action);
    }
  };
  return actionExecutor;
};

describe("GraphQlClient", () => {
  it("should be a function", () => {
    expect(GraphQlClient, "to be a function");
  });

  it("should throw if no fetch is provided", () => {
    expect(
      () => {
        new GraphQlClient();
      },
      "to throw",
      "fetch() implementation was not provided."
    );
  });

  it("should execute a query", () => {
    const actionExecutor = createMockActionExecutor();
    const graphQlClient = new GraphQlClient({ fetch: () => {} });
    graphQlClient.actionExecutor = actionExecutor;

    const res = graphQlClient.query({
      query: "foo",
      variables: {}
    });

    expect(res, "to be a", Promise);

    expect(actionExecutor.queue, "to have items satisfying", {
      query: "foo",
      resolve: expect.it("to be a function")
    });

    actionExecutor.queue.map(action => action.resolve("foobar"));

    return expect(res, "to be fulfilled with", "foobar");
  });

  it("should execute a mutate", () => {
    const actionExecutor = createMockActionExecutor();
    const graphQlClient = new GraphQlClient({ fetch: () => {} });
    graphQlClient.actionExecutor = actionExecutor;

    const res = graphQlClient.mutate({
      query: "foo",
      variables: {}
    });

    expect(res, "to be a", Promise);

    expect(actionExecutor.queue, "to have items satisfying", {
      query: "foo",
      resolve: expect.it("to be a function")
    });

    actionExecutor.queue.map(action => action.resolve("foobar"));

    return expect(res, "to be fulfilled with", "foobar");
  });
});
