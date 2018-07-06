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

//Create a string of random alphanumeric characters of a given length
helpers.createRandomString = strLength => {
  strLength =
    typeof strLength === "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    //all the possible characters that could go into a string
    var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    var randomString = "";
    for (let i = 0; i < strLength; i++) {
      let randomChar = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      randomString += randomChar;
    }
    return randomString;
  } else {
    return false;
  }
};
module.exports = helpers;
