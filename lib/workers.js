//These are worker related tasks
//Dependencies
var path = require("path");
var fs = require("fs");
var _data = require("./data");
var https = require("https");
var http = require("http");
var helpers = require("./handlers");
var url = require("url");

//Instantiate the workers Object
var workers = {};

//Set up loop method to run every 1 min
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
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
      ? checkData.id
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
};

//initialize worker
workers.init = () => {
  //Execute all checks immediately
  workers.gatherAllChecks();

  //Call the loop so checks will execute later on
  workers.loop();
};

module.exports = workers;
