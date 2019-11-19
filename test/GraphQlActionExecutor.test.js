import expect from "unexpected";

import GraphQlNetworkInterface from "../lib/GraphQlNetworkInterface";
import GraphQlActionExecutor from "../lib/GraphQlActionExecutor";
import GraphQlAction from "../lib/GraphQlAction";

describe("GraphQlActionExecutor", () => {
  let actionExecutor;
  beforeEach(() => {
    const graphQlNetworkInterface = new GraphQlNetworkInterface();
    actionExecutor = new GraphQlActionExecutor(graphQlNetworkInterface);
  });

  it("should resolve an action", () => {
    const request = () => Promise.resolve("The Result");
    actionExecutor.network.request = request;

    const action = GraphQlAction.query({ query: "foobar" });

    actionExecutor.execute(action);

    return expect(
      action.getPromise(),
      "when fulfilled",
      "to satisfy",
      "The Result"
    );
  });

  it("should reject an action", () => {
    const request = () => Promise.reject(new Error("The Error"));
    actionExecutor.network.request = request;

    const action = GraphQlAction.query({ query: "foobar" });

    actionExecutor.execute(action);

    return expect(
      action.getPromise(),
      "when rejected",
      "to satisfy",
      "The Error"
    );
  });

  it("should batch two pending queries", () => {
    const request = () => Promise.reject(new Error("The Error"));
    actionExecutor.network.request = request;
    const batchRequest = () =>
      Promise.resolve([{ data: "The result 1" }, { data: "The result 2" }]);
    actionExecutor.network.batchRequest = batchRequest;

    const action1 = GraphQlAction.query({ query: "query { username }" });
    const action2 = GraphQlAction.query({ query: "query { username, age }" });

    actionExecutor.execute(action1);
    actionExecutor.execute(action2);

    return expect(
      Promise.all([action1.getPromise(), action2.getPromise()]),
      "when fulfilled",
      "to equal",
      [{ data: "The result 1" }, { data: "The result 2" }]
    );
  });
});
