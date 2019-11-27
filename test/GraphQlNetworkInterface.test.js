import expect from "unexpected";
import fetchceptionModule from "fetchception";
import httpErrors from "httperrors";
import sinon from "sinon";

import GraphQlNetworkInterface from "../lib/GraphQlNetworkInterface";
import GraphQlAction from "../lib/GraphQlAction";
import GraphQlSyntaxError from "../lib/GraphQlSyntaxError";
import UnknownHttpError from "../lib/UnknownHttpError";

describe("GraphQlNetworkInterface", () => {
  let network;
  let fetchception;

  beforeEach(() => {
    network = new GraphQlNetworkInterface();
    // make fetchception work with .fetch property
    global.fetch = network.fetch;
    global.Response = network.fetch.Response;
    fetchception = (mocks, factory) => {
      fetchceptionModule(mocks, () => {
        network.fetch = global.fetch;

        return factory();
      });
    };
  });

  it("should throw when executing an invalid action", () => {
    expect(
      () => {
        network.dispatch({ query: "foo" });
      },
      "to throw",
      "Invalid GraphQlAction."
    );
  });

  it("should dispatch a single request", () => {
    network.request = sinon.spy().named("network.request");

    network.dispatch({ query: "foo" });

    expect(network.request.getCall(0).args, "to equal", [{ query: "foo" }]);
    expect(network.request.calledOnce, "to be true");
  });

  it("should send a request off to the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          body: {
            data: {
              getMailFolders: {
                mailFolders: [
                  { name: "INBOX" },
                  { name: "INBOX.Drafts" },
                  { name: "INBOX.Archive" }
                ]
              }
            }
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query {
                  getMailFolders {
                      mailFolders {
                          name
                      }
                  }
              }
          `
        });

        return expect(network.request(action), "when fulfilled", "to satisfy", {
          data: {
            getMailFolders: {
              mailFolders: [
                { name: "INBOX" },
                { name: "INBOX.Drafts" },
                { name: "INBOX.Archive" }
              ]
            }
          }
        });
      }
    ));

  it("should allow on onSuccess callback", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          headers: {
            "X-Custom-Header": "woot"
          },
          body: {
            data: {
              foobar: "baz"
            }
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query {
                  foobar
              }
          `
        });
        let onSuccessArgs;
        const onSuccess = (...args) => (onSuccessArgs = args);
        const network = new GraphQlNetworkInterface({ onSuccess });

        return expect(network.request(action), "to be fulfilled").then(() => {
          expect(onSuccessArgs, "to satisfy", [
            expect.it(value =>
              expect(value.headers.get("X-Custom-Header"), "to equal", "woot")
            )
          ]);
        });
      }
    ));

  it('should report an error on the query if one was contained within "errors"', () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          body: {
            errors: [
              {
                error: { type: "UidValidityConflict" },
                query: "getMailFolders"
              }
            ]
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query {
                  getMailFolders {
                      error {
                          type
                      }
                      mailFolders {
                          name
                      }
                  }
              }
          `
        });

        return expect(network.request(action), "when fulfilled", "to satisfy", {
          data: {
            getMailFolders: {
              error: {
                type: "UidValidityConflict"
              }
            }
          }
        });
      }
    ));

  it('should report errors on the query if multiple were contained within "errors"', () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          body: {
            errors: [
              {
                error: { type: "UidValidityConflict" },
                query: "getMailFolders"
              },
              {
                error: { type: "Conflict" },
                query: "getMailsById"
              }
            ]
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query {
                  getMailFolders {
                      error {
                          type
                      }
                      mailFolders {
                          name
                      }
                  }
                  getMailsById {
                      error {
                          type
                      }
                      mailFolders {
                          name
                      }
                  }
              }
          `
        });

        return expect(network.request(action), "when fulfilled", "to satisfy", {
          data: {
            getMailFolders: {
              error: {
                type: "UidValidityConflict"
              }
            },
            getMailsById: {
              error: {
                type: "Conflict"
              }
            }
          }
        });
      }
    ));

  it("should report an error on a known http status code", () => {
    sinon.stub(network, "fetch").returns(
      Promise.resolve({
        status: 400
      })
    );

    const action = GraphQlAction.query({
      query: "query { username }"
    });

    return expect(
      network.request(action),
      "to be rejected with",
      new httpErrors.BadRequest()
    );
  });

  it("should report an error on an unknown http status code", () => {
    sinon.stub(network, "fetch").returns(
      Promise.resolve({
        status: 537
      })
    );

    const action = GraphQlAction.query({
      query: "query { username }"
    });

    return expect(
      network.request(action),
      "to be rejected with",
      new UnknownHttpError({
        statusCode: 537
      })
    );
  });

  it("should report a syntax error from the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          statusCode: 200,
          body: {
            errors: [
              {
                message: "Syntax Error GraphQL (2:15)",
                locations: [{ line: 2, column: 15 }],
                path: ["getMail"]
              }
            ],
            data: null
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
          `
        });

        return expect(
          network.request(action),
          "to be rejected with",
          new GraphQlSyntaxError({
            data: {
              locations: [{ line: 2, column: 15 }]
            }
          })
        );
      }
    ));

  it("should report non-HTTP errors from the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          statusCode: 200,
          body: {
            errors: [
              {
                message: "random error"
              }
            ],
            data: null
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
          `
        });

        return expect(
          network.request(action),
          "to be rejected with",
          new Error("random error")
        );
      }
    ));

  it("should report any other error from the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          statusCode: 200,
          body: {
            errors: [null],
            data: null
          }
        }
      },
      () => {
        const action = GraphQlAction.query({
          query: `
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
          `
        });

        return expect(
          network.request(action),
          "to be rejected with",
          new Error("Unknown GraphQL error")
        );
      }
    ));

  it("should send a simple mutation to the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          statusCode: 200,
          body: {
            data: {
              buildMail: {
                mail: {
                  id: "foobar"
                }
              }
            }
          }
        }
      },
      () => {
        const action = GraphQlAction.mutation({
          query: `
              mutation foo {
                  buildMail(id: "foo") {
                      error { type }
                      mail { id }
                  }
              }
          `
        });

        return expect(network.request(action), "when fulfilled", "to satisfy", {
          data: {
            buildMail: {
              mail: {
                id: "foobar"
              }
            }
          }
        });
      }
    ));

  it("should send a mutation with attachments to the GraphQL backend", () =>
    fetchception(
      {
        request: "POST /api/graphql",
        response: {
          statusCode: 200,
          body: {
            data: {
              buildMail: {
                mail: {
                  id: "foobar",
                  parts: [{ id: "foo" }, { id: "bar" }]
                }
              }
            }
          }
        }
      },
      () => {
        const action = GraphQlAction.mutation({
          query: `
              mutation foo {
                  buildMail(id: "foo") {
                      error { type }
                      mail {
                          id
                          parts {
                              id
                          }
                      }
                  }
              }
          `,
          uploads: [
            { name: "foo", payload: "foostring" },
            { name: "bar", payload: "barstring" }
          ]
        });

        return expect(network.request(action), "when fulfilled", "to satisfy", {
          data: {
            buildMail: {
              mail: {
                id: "foobar",
                parts: [{ id: "foo" }, { id: "bar" }]
              }
            }
          }
        });
      }
    ));

  it("should execute a batchRequest", () =>
    fetchception(
      [
        {
          request: {
            method: "POST",
            url: "/api/graphql",
            headers: {
              "Content-Type": "application/json"
            },
            body: [
              { query: expect.it("to match", /\{\s*foo\s*\}/) },
              { query: expect.it("to match", /\{\s*bar\s*\}/) }
            ]
          },
          response: {
            statusCode: 200,
            body: {
              errors: null,
              data: [{ foo: "foobar" }, { bar: "foobar" }]
            }
          }
        }
      ],
      () => {
        const actions = [
          GraphQlAction.query({ query: "query { foo }" }),
          GraphQlAction.query({ query: "query { bar }" })
        ];

        return expect(network.dispatch(actions), "to be fulfilled with", {
          errors: null,
          data: [{ foo: "foobar" }, { bar: "foobar" }]
        });
      }
    ));

  describe("when batched", () => {
    it('should report errors for each query if any were contained within their "errors"', () =>
      fetchception(
        {
          request: "POST /api/graphql",
          response: {
            body: [
              {
                data: {
                  getPreferences: {
                    preferences: {
                      foo: null,
                      bar: null
                    },
                    error: null
                  }
                }
              },
              {
                data: {
                  getMailsById: {
                    error: null,
                    mails: null
                  }
                },
                errors: [
                  {
                    error: {
                      type: "Conflict"
                    },
                    query: "getMailsById"
                  }
                ]
              }
            ]
          }
        },
        () => {
          const action1 = GraphQlAction.query({
            query: `
                  query {
                      getPreferences {
                          preferences {
                              foo
                              bar
                          }
                          error {
                              type
                          }
                      }
                  }
              `
          });
          const action2 = GraphQlAction.query({
            query: `
                  query {
                      getMailsById {
                          error {
                              type
                          }
                          mailFolders {
                              name
                          }
                      }
                  }
              `
          });

          return expect(
            network.batchRequest([action1, action2]),
            "when fulfilled",
            "to satisfy",
            [
              {
                data: {
                  getPreferences: {
                    preferences: {
                      foo: null,
                      bar: null
                    },
                    error: null
                  }
                }
              },
              {
                data: {
                  getMailsById: {
                    error: {
                      type: "Conflict"
                    }
                  }
                }
              }
            ]
          );
        }
      ));
  });
});
