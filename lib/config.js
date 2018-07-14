/**
 * Create and export configuration variables
 */
//container for all environment variables
const environments = {};

//Staging(default) enviornment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "thisNodeOnlySecret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACf6f3504bbd93def443afefcd03036e6d",
    authToken: "c7eefda80250966b3ee340dccb029e53",
    fromPhone: "+14156129712"
  }
};
//Production environment
environments.production = {
  httpPort: 8000,
  httpsPort: 8001,
  envName: "production",
  hashingSecret: "thisNodeOnlyProductionSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACf6f3504bbd93def443afefcd03036e6d",
    authToken: "c7eefda80250966b3ee340dccb029e53",
    fromPhone: "+14156129712"
  }
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
