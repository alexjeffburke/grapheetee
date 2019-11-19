import createError from "createerror";
import httpErrors from "httperrors";

const UnknownHttpError = createError(
  {
    name: "UnknownHttpError"
  },
  httpErrors.InternalServerError
);

export default UnknownHttpError;
