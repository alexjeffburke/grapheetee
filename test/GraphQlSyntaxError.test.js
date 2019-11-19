import expect from "unexpected";

import GraphQlSyntaxError from "../lib/GraphQlSyntaxError";

describe("GraphQlSyntaxError", () => {
  it("should default to status code 500", () => {
    expect(new GraphQlSyntaxError(), "to satisfy", {
      name: "GraphQlSyntaxError",
      statusCode: 400
    });
  });
});
