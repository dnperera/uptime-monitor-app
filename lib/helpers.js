/**
 * Helpers for various tasks
 */

//Define container for all the helpers
var helpers = {};

//Create a SHA256 hash
helpers.hashPassword = str => {
  if (typeof str === "string" && str.length > 0) {
  } else {
    return false;
  }
};

module.exports = helpers;
