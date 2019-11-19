import expect from "unexpected";

import UnknownHttpError from "../lib/UnknownHttpError";

describe("UnknownHttpError", () => {
  it("should default to status code 500", () => {
    expect(new UnknownHttpError(), "to satisfy", {
      name: "UnknownHttpError",
      statusCode: 500
    });
  });

  it("should persist a custom status code", () => {
    expect(
      new UnknownHttpError({
        statusCode: 12345
      }),
      "to satisfy",
      {
        name: "UnknownHttpError",
        statusCode: 12345
      }
    );
  });
});
