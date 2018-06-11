/**
 * Create and export configuration variables
 */
//container for all environment variables
const environments = {};

//Staging(default) enviornment
environments.staging = {
  port: 3000,
  envName: "staging"
};
//Production environment
environments.production = {
  port: 5000,
  envName: "production"
};
//Determin which environment was passed as a command line argument.
const currentEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLocaleLowerCase()
    : "";
//check the current environment pass is one of the above defined. if not default to staging
const enviornmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;
module.exports = enviornmentToExport;
