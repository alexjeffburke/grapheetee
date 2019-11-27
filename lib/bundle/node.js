import fetch from "node-fetch";
import FormData from "form-data";

import GraphQlClient from "../GraphQlClient";

export default options => {
  return new GraphQlClient({ ...options, fetch, FormData });
};
