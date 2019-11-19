import fetch from "node-fetch";
import FormData from "form-data";
import httpErrors from "httperrors";
import set from "lodash.set";

import { GRAPHQL_QUERY, GRAPHQL_MUTATION } from "./GraphQlAction";
import GraphQlSyntaxError from "./GraphQlSyntaxError";
import NetworkInterfaceError from "./NetworkInterfaceError";
import UnknownHttpError from "./UnknownHttpError";

function processGraphqlResult(response) {
  const { errors: responseErrors } = response;
  let sawExpectedErrors = false;

  if (Array.isArray(responseErrors)) {
    for (const responseError of responseErrors) {
      const { query, error } = responseError || {};
      // use the presence of a query property to handle as a query error
      if (query && error) {
        // record expected errors has been encountered
        sawExpectedErrors = true;
        // attach the error to the query
        set(response, `data.${query}.error`, error);
      }
    }

    if (sawExpectedErrors) {
      // return for expected case handling
      return response;
    } else if (responseErrors.length === 1) {
      const possibleSpecificError = responseErrors[0] || {};
      // wrap as an error (if possible)
      const possibleSpecificErrorMessage =
        possibleSpecificError.message || "Unknown GraphQL error";
      if (possibleSpecificErrorMessage.startsWith("Syntax Error GraphQL")) {
        throw new GraphQlSyntaxError({
          data: {
            locations: possibleSpecificError.locations || []
          }
        });
      } else {
        throw new Error(possibleSpecificErrorMessage);
      }
    } else {
      throw responseErrors;
    }
  }

  return response;
}

export default class GraphQlNetworkInterface {
  constructor(options) {
    options = options || {};

    this.fetch = options.fetch || fetch;
  }

  dispatch(action) {
    if (Array.isArray(action)) {
      return this.batchRequest(action);
    } else {
      return this.request(action);
    }
  }

  _request(opts) {
    const args = [
      "/api/graphql",
      {
        method: "POST",
        credentials: "same-origin",
        ...opts
      }
    ];

    return this.fetch(...args)
      .catch(e => {
        throw new NetworkInterfaceError({
          error: e,
          requestOptions: args
        });
      })
      .then(response => {
        if (response.status < 200 || response.status > 399) {
          const SpecificHttpError = httpErrors[response.status];
          if (SpecificHttpError) {
            throw new SpecificHttpError();
          } else {
            throw new UnknownHttpError({
              statusCode: response.status
            });
          }
        }

        return response.json();
      })
      .then(result => {
        if (Array.isArray(result)) {
          return result.map(processGraphqlResult);
        } else {
          return processGraphqlResult(result);
        }
      });
  }

  batchRequest(actions) {
    const batchedQuery = actions.map(({ query, variables }) => ({
      variables,
      query: query
    }));

    return this._request({
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(batchedQuery)
    });
  }

  request(action) {
    const { query, variables, type, uploads } = action;
    if (type === GRAPHQL_QUERY || (type === GRAPHQL_MUTATION && !uploads)) {
      return this._request({
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          variables
        })
      });
    } else if (type === GRAPHQL_MUTATION && Array.isArray(uploads)) {
      const formData = new FormData();

      formData.append(
        "request",
        JSON.stringify({
          query: query,
          variables
        })
      );

      uploads.forEach(({ name, payload }) => formData.append(name, payload));

      return this._request({
        body: formData
      });
    } else {
      throw new Error("Invalid GraphQlAction.");
    }
  }
}
