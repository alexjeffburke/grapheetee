import createError from "createerror";
import httpErrors from "httperrors";

const GraphQlSyntaxError = createError(
  {
    name: "GraphQlSyntaxError"
  },
  httpErrors.BadRequest
);

export default GraphQlSyntaxError;
