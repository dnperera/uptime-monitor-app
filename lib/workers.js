//These are worker related tasks
//Dependencies
var path = require("path");
var fs = require("fs");
var _data = require("./data");
var https = require("https");
var http = require("http");
var helpers = require("./helpers");
var url = require("url");

//Instantiate the workers Object
var workers = {};

//Set up loop method to run every 1 min
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 10);
};
//Look up all checks and get all data,send to a validator
workers.gatherAllChecks = () => {
  //get all checks
  _data.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      //Read the original data in each check and validate
      checks.forEach(check => {
        _data.read("checks", check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            //pass all check data to the validator
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error in reading one the check data in the file");
          }
        });
      });
    } else {
      console.log("Error: Could not find any checks to process");
    }
  });
};
//sanity-check the check data
workers.validateCheckData = checkData => {
  checkData =
    typeof checkData === "object" && checkData !== null ? checkData : {};
  checkData.id =
    typeof checkData.id === "string" && checkData.id.trim().length === 20
      ? checkData.id
      : false;
  checkData.userPhone =
    typeof checkData.userPhone === "string" &&
    checkData.userPhone.trim().length === 10
      ? checkData.userPhone
      : false;
  checkData.protocol =
    typeof checkData.protocol === "string" &&
    ["http", "https"].indexOf(checkData.protocol) > -1
      ? checkData.protocol
      : false;
  checkData.url =
    typeof checkData.url === "string" && checkData.url.length > 0
      ? checkData.url
      : false;
  checkData.method =
    typeof checkData.method === "string" &&
    ["post", "get", "put", "delete"].indexOf(checkData.method) > -1
      ? checkData.method
      : false;
  checkData.successCodes =
    Array.isArray(checkData.successCodes) && checkData.successCodes.length > 0
      ? checkData.successCodes
      : false;
  checkData.timeoutSeconds =
    typeof checkData.timeoutSeconds === "number" &&
    checkData.timeoutSeconds % 1 === 0 &&
    checkData.timeoutSeconds >= 1 &&
    checkData.timeoutSeconds <= 5
      ? checkData.timeoutSeconds
      : false;
  //set the keys whether this check ever run by workers before .if it is ran before add the time stamp
  checkData.state =
    typeof checkData.state === "string" &&
    ["up", "down"].indexOf(checkData.state) > -1
      ? checkData.state
      : "down";
  checkData.lastChecked =
    typeof checkData.lastChecked === "number" && checkData.timeoutSeconds > 0
      ? checkData.lastChecked
      : false;
  //if all the checks pass, pass the data along to the next step in the process
  console.log(
    checkData.id,
    checkData.userPhone,
    checkData.protocol,
    checkData.url,
    checkData.method,
    checkData.successCodes,
    checkData.timeoutSeconds
  );
  if (
    checkData.id &&
    checkData.userPhone &&
    checkData.protocol &&
    checkData.url &&
    checkData.method &&
    checkData.successCodes &&
    checkData.timeoutSeconds
  ) {
    workers.performCheck(checkData);
  } else {
    console.log(
      "Error:One of the checks is not properly formatted.Skipping it"
    );
  }
};

//Perform the check,send the original checkData and the out come of the check process  to the next step

workers.performCheck = checkData => {
  //prepare the initial check outcome object
  var checkOutcome = {
    error: false,
    responseCode: false
  };
  //Mark that the outcome has not been sent yet
  var outcomeSent = false;
  //Parse the hostname and the path out the original check data
  var parsedUrl = url.parse(checkData.protocol + "://" + checkData.url);
  var hostname = parsedUrl.hostname;
  var path = parsedUrl.path; //we are using path not the pathame since we need query string

  //construct the request
  var requestDetail = {
    protocol: checkData.protocol + ":",
    hostname: hostname,
    method: checkData.method.toUpperCase(),
    path: path,
    timeout: checkData.timeoutSeconds * 1000
  };
  //instantiate the request object using either http or https
  var _moduleToUse = checkData.protocol === "http" ? http : https;
  var req = _moduleToUse.request(requestDetail, res => {
    //Grab the response status
    console.log("Incoming Response Code --", res.statusCode);
    var status = res.statusCode;
    //update the checkOutcome object value
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome);
      outcomeSent = true;
    }
  });
  //check if there is any request error , then bind the error event so it does not get thrown
  req.on("error", err => {
    //update the outcome object and pass the data along
    checkOutcome.error = {
      error: true,
      value: err
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome);
      outcomeSent = true;
    }
  });
  //Bind to the timeout event
  req.on("timeout", err => {
    //update the outcome object and pass the data along
    checkOutcome.error = {
      error: true,
      value: "timeout"
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome);
      outcomeSent = true;
    }
  });

  //End the request
  req.end();
};

//process the check outcome,update the checkdata as needed,trigger sms alert to the user if needed
//need to verify whether the check never process before .if it is no user alert.
workers.processCheckOutcome = (checkData, checkOutcome) => {
  //verify whether the check status is up or down
  var state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    checkData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";
  //Decide if an alert is neccessary
  var alertWarranted =
    checkData.lastChecked && checkData.state !== state ? true : false;
  //update the check data in the file
  var newCheckData = checkData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();
  //update
  _data.update("checks", newCheckData.id, newCheckData, err => {
    if (!err) {
      //send the newCheckData to the next phase in the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Checkoutcome is not changed . No user alert needed!!");
      }
    } else {
      console.log("Error occurs trying to update related check file");
    }
  });
};

//Alert the user via sms about the status change
workers.alertUserToStatusChange = newCheckData => {
  var msg = `Alert: Your check for ${newCheckData.method.toUpperCase()}  ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, err => {
    if (!err) {
      console.log(
        "Success : User was alerted to a status change in their check",
        msg
      );
    } else {
      console.log(
        "Error :could not send the sms to the user about state change in Check"
      );
    }
  });
};
//initialize worker
workers.init = () => {
  //Execute all checks immediately
  workers.gatherAllChecks();

  //Call the loop so checks will execute later on
  workers.loop();
};

module.exports = workers;
