import expect from "unexpected";
import fetchception from "fetchception";
import httpErrors from "httperrors";
import sinon from "sinon";

import FormData from "form-data";
import { Response } from "node-fetch";

import GraphQlNetworkInterface from "../lib/GraphQlNetworkInterface";
import GraphQlAction from "../lib/GraphQlAction";
import GraphQlSyntaxError from "../lib/GraphQlSyntaxError";
import UnknownHttpError from "../lib/UnknownHttpError";

const fetch = { Response };
const url = "/api/graphql";

describe("GraphQlNetworkInterface", () => {
  before(() => {
    // FIXME: window must be global for fetchception to opearate correctly
    global.window = global;
    global.fetch = fetch;
    global.Response = fetch.Response;
    global.FormData = FormData;
  });

  after(() => {
    delete global.fetch;
    delete global.Response;
    delete global.FormData;
    delete global.window;
  });

  it("should throw when executing an invalid action", () => {
    expect(
      () => {
        new GraphQlNetworkInterface({ url: "/", fetch: () => {} }).dispatch({
          query: "foo"
        });
      },
      "to throw",
      "Invalid GraphQlAction."
    );
  });

  it("should dispatch a single request", () => {
    const network = new GraphQlNetworkInterface({ url: "/", fetch: () => {} });
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
        const action = GraphQlAction.query(`
              query {
                  getMailFolders {
                      mailFolders {
                          name
                      }
                  }
              }
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.query(`
              query {
                  foobar
              }
        `);
        let onSuccessArgs;
        const onSuccess = (...args) => (onSuccessArgs = args);
        const network = new GraphQlNetworkInterface({ url, onSuccess });

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
        const action = GraphQlAction.query(`
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
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.query(`
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
        `);
        const network = new GraphQlNetworkInterface({ url });

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
    const fetch = sinon
      .stub()
      .named("fetch")
      .resolves({
        status: 400
      });
    const network = new GraphQlNetworkInterface({ url, fetch });

    const action = GraphQlAction.query("query { username }");

    return expect(
      network.request(action),
      "to be rejected with",
      new httpErrors.BadRequest()
    );
  });

  it("should report an error on an unknown http status code", () => {
    const fetch = sinon
      .stub()
      .named("fetch")
      .resolves({
        status: 537
      });
    const network = new GraphQlNetworkInterface({ url, fetch });

    const action = GraphQlAction.query("query { username }");

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
        const action = GraphQlAction.query(`
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.query(`
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.query(`
              query Foo {
                  getMail(id: "sdaf") {
                      mail {
                        subject
                      }
                  }
              }
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.mutation(`
              mutation foo {
                  buildMail(id: "foo") {
                      error { type }
                      mail { id }
                  }
              }
        `);
        const network = new GraphQlNetworkInterface({ url });

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
        const action = GraphQlAction.mutation(
          `
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
          {
            uploads: [
              { name: "foo", payload: "foostring" },
              { name: "bar", payload: "barstring" }
            ]
          }
        );
        const network = new GraphQlNetworkInterface({ url });

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
          GraphQlAction.query("query { foo }"),
          GraphQlAction.query("query { bar }")
        ];
        const network = new GraphQlNetworkInterface({ url });

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
          const action1 = GraphQlAction.query(`
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
          `);
          const action2 = GraphQlAction.query(`
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
          `);
          const network = new GraphQlNetworkInterface({ url });

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
