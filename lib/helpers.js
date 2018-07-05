/**
 * Helpers for various tasks
 */
var crypto = require("crypto");
var config = require("../lib/config");

//Define container for all the helpers
var helpers = {};

//Create a Hash  using SHA256  method
helpers.hashPassword = str => {
  if (typeof str === "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};
//parse a json string to an object
helpers.parseJsonToObject = str => {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {};
  }
};

module.exports = helpers;
