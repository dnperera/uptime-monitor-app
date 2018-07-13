/**
 * Helpers for various tasks
 */
var crypto = require("crypto");
var config = require("../lib/config");
var https = require("https");
var queryString = require("querystring");

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

//Send sms via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  //validate incoming params
  phone =
    typeof phone === "string" && phone.trim().length === 10
      ? phone.trim()
      : false;
  msg =
    typeof msg === "string" && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {
    //configure the request payload to twilio
    var payload = {
      From: config.twilio.fromPhone,
      To: "+1" + phone,
      Body: msg
    };
    //Stringify the payload
    var stringPayload = queryString.stringify(payload);
    //Configure the request details
    var requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };
    //Instantiate the request object
    var req = https.request(requestDetails, res => {
      //grab the status of the sent request
      var status = res.statusCode;
      //callback successfully if the request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });
    //Bind to the error event so it does not get thrown
    req.on("error", e => {
      callback(e);
    });
    //Add playload to the request
    req.write(stringPayload);
    //End the request
    req.end();
  } else {
    callback("Invalid phone or message");
  }
};

module.exports = helpers;
