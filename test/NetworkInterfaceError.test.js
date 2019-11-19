import expect from "unexpected";

import NetworkInterfaceError from "../lib/NetworkInterfaceError";

describe("NetworkInterfaceError", () => {
  it("should persist a custom status code", () => {
    const originalError = new TypeError("Mocked fail to fetch");

    expect(
      new NetworkInterfaceError({
        error: originalError,
        requestOptions: ["/foo/bar"]
      }),
      "to satisfy",
      {
        name: "NetworkInterfaceError",
        message: "Network Interface Error",
        code: "NETINTERFACEERR",
        originalErr: originalError,
        requestOptions: ["/foo/bar"],
        stack: originalError.stack
      }
    );
  });

  it("should default missing values", () => {
    expect(new NetworkInterfaceError(), "to satisfy", {
      name: "NetworkInterfaceError",
      message: "Network Interface Error",
      code: "NETINTERFACEERR",
      originalErr: null,
      requestOptions: [],
      stack: null
    });
  });
});
