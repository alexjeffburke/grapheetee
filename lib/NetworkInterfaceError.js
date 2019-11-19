import createError from "createerror";

const NetworkInterfaceError = createError({
  name: "NetworkInterfaceError",
  message: "Network Interface Error",
  code: "NETINTERFACEERR",
  preprocess: options => {
    if (options) {
      // alter a copy
      options = { ...options };
    } else {
      options = {};
    }

    const { error = null } = options;

    // keep hold of the original
    options.originalErr = error;
    delete options.error;
    // make sure we have request options
    options.requestOptions = options.requestOptions || [];
    // attach the original error stack
    options.stack = error ? error.stack : null;

    return options;
  }
});

export default NetworkInterfaceError;
