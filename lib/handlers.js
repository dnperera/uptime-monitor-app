/**
 * Request Handlers
 */
//Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");
const path = require("path");
const fs = require("fs");
//Define route handlers
const handlers = {};

/**
 * HTML Handlers ...
 */
//Index Handler
handlers.index = (data, callback) => {
  //Reject any request that is not 'GET'
  if (data.method === "get") {
    //Read in a template as a string
    helpers.getTemplate("index", (err, str) => {
      if (!err && str) {
        callback(200, str, "html");
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

/**
 * JSON API Handlers
 */
//Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};
//Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

handlers.users = (data, callback) => {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};
//Containers for user's submit methods

handlers._users = {};
//users post
//Require data : firstname,lastname,phone,password,tosAgreement
//Optional data :nonne
handlers._users.post = (data, callback) => {
  console.log("payload ", data.payload);
  //check all required fields filled out or not
  var firstname =
    typeof data.payload.firstname === "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstname.trim()
      : false;
  var lastname =
    typeof data.payload.lastname === "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastname.trim()
      : false;
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement === true
      ? true
      : false;

  if (firstname && lastname && phone && password && tosAgreement) {
    //make sure user does not already exist
    _data.read("users", phone, (error, data) => {
      if (error) {
        //Hash the passowrd
        var hashedPassword = helpers.hashPassword(password);
        if (hashedPassword) {
          //create the user object
          var newUser = {
            firstname: firstname,
            lastname: lastname,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: tosAgreement
          };
          //store the user
          _data.create("users", phone, newUser, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(error);
              callback(500, { Error: "Could not create the new user!" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        callback(400, { Error: "A user with that phone number already exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields!." });
  }
};
//Users get
//Required data : phone number
//Optinal : none
//Output : make sure to remove the hashedpassword from user details before sending

handlers._users.get = (data, callback) => {
  //check for valid phone number
  var phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //first get the token from the header
    var token =
      typeof data.headers.token === "string" && data.headers.token.length === 20
        ? data.headers.token
        : false;
    //verify that given token is valid for the phone & not expired
    handlers._tokens.verifyToken(token, phone, isValid => {
      if (isValid) {
        //if the user valid lookup the use details
        _data.read("users", phone, (error, result) => {
          if (!error && result) {
            //remove the hashed password from the user object before returning
            delete result.hashedPassword;
            callback(200, result);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: "Missing token in header or invalid token" });
      }
    });
  } else {
    callback(400, { Error: "Invalid phone number!!!" });
  }
};
//users put
//Required data :phone
//Optional :firstname,lastname,password(at least one field must be specified)
handlers._users.put = (data, callback) => {
  //check for the required field
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;
  if (phone) {
    //first get the token from the header
    var token =
      typeof data.headers.token === "string" && data.headers.token.length === 20
        ? data.headers.token
        : false;

    var firstname =
      typeof data.payload.firstname === "string" &&
      data.payload.firstname.trim().length > 0
        ? data.payload.firstname.trim()
        : false;
    var lastname =
      typeof data.payload.lastname === "string" &&
      data.payload.lastname.trim().length > 0
        ? data.payload.lastname.trim()
        : false;

    var password =
      typeof data.payload.password === "string" &&
      data.payload.password.trim().length > 0
        ? data.payload.password.trim()
        : false;
    if (firstname || lastname || password) {
      //verify that given token is valid for the phone & not expired
      handlers._tokens.verifyToken(token, phone, isValid => {
        if (isValid) {
          //check user exist
          _data.read("users", phone, (err, userData) => {
            if (!err && userData) {
              if (firstname) {
                userData.firstname = firstname;
              }
              if (lastname) {
                userData.lastname = lastname;
              }
              if (password) {
                userData.hashedPassword = helpers.hashPassword(password);
              }
              //update the user record
              _data.update("users", phone, userData, err => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { Error: "Could not update the user " });
                }
              });
            } else {
              console.log(err);
              callback(400, { Error: "User does not exit!!" });
            }
          });
        } else {
          callback(403, { Error: "Missing token in header or invalid token" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Invalid phone number." });
  }
};
//users delete
//Required : phone
//TODO : delete anyother data files related to this user
handlers._users.delete = (data, callback) => {
  //check for the required field
  var phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //first get the token from the header
    var token =
      typeof data.headers.token === "string" && data.headers.token.length === 20
        ? data.headers.token
        : false;
    //verify that given token is valid for the phone & not expired
    handlers._tokens.verifyToken(token, phone, isValid => {
      if (isValid) {
        //check user exist
        _data.read("users", phone, (error, userData) => {
          if (!error && userData) {
            _data.delete("users", phone, err => {
              if (!err) {
                //Delete all the checks user created
                let userChecks = Array.isArray(userData.checks)
                  ? userData.checks
                  : [];
                let noOfChecks = userChecks.length;

                if (noOfChecks > 0) {
                  let noOfDeleted = 0;
                  let deletionErrors = false;

                  userChecks.forEach(checkid => {
                    _data.delete("checks", checkid, err => {
                      if (err) {
                        deletionErrors = true;
                      }
                      noOfDeleted++;
                      if (noOfDeleted === noOfChecks) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Some errors occured during deletion of checks.There may be some checks left"
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Can not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "User does not exist!!" });
          }
        });
      } else {
        callback(403, { Error: "Missing token in header or invalid token" });
      }
    });
  } else {
    callback(400, { Error: "Invalid phone number." });
  }
};
//Tokens
handlers.tokens = (data, callback) => {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

//Container for tokens
handlers._tokens = {};
//Token-post
//Required :phone,password
//Optional :none

handlers._tokens.post = (data, callback) => {
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  if (phone && password) {
    //then check ser with matching phone number exist
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        //hash the incoming password and compar with stored password
        var hashedPassword = helpers.hashPassword(password);
        if (userData.hashedPassword === hashedPassword) {
          //if user valid , create new token and set expire time in 1 hr
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            phone: phone,
            tokenId: tokenId,
            expires: expires
          };
          //Store the token
          _data.create("tokens", tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              console.log(err);
              callback(500, { Error: "Token can not be saved!" });
            }
          });
        } else {
          callback(400, {
            Error: "Password did not match with stored password !."
          });
        }
      } else {
        callback(400, {
          Error: "User does not exist with that phone number!!!"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields!!!" });
  }
};
//Token-get
//Required :tokenId
//Optional:none
handlers._tokens.get = (data, callback) => {
  //check for valid phone number
  var tokenId =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
  if (tokenId) {
    //lookup the token
    _data.read("tokens", tokenId, (error, result) => {
      if (!error && result) {
        callback(200, result);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Invalid token!!!" });
  }
};
//Token-put
//Required :tokenId,extend
//optional data : none

handlers._tokens.put = (data, callback) => {
  //check for the required field
  var tokenId =
    typeof data.payload.id === "string" && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend === "boolean" && data.payload.extend === true
      ? true
      : false;
  if (tokenId && extend) {
    //Look for the token
    _data.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        //check whether token already expired .
        if (tokenData.expires > Date.now()) {
          //if it is not expired . set the new expir time for an hour
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          //Store the new expire time
          _data.update("tokens", tokenId, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the toke's expiration"
              });
            }
          });
        } else {
          callback(400, {
            Error: "Token has already expired ,and can not be extended"
          });
        }
      } else {
        callback(400, { Error: "Token does not exist." });
      }
    });
  } else {
    callback(400, { Error: "Invalid token or extend time status" });
  }
};
//Token-delete
//Required : token id
//Optional data :none
handlers._tokens.delete = (data, callback) => {
  //check for the required field
  var tokenId =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
  if (tokenId) {
    //check token exist
    _data.read("tokens", tokenId, (error, tokenData) => {
      if (!error && tokenData) {
        _data.delete("tokens", tokenId, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Can not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Token does not exist!!" });
      }
    });
  } else {
    callback(400, { Error: "Invalid token." });
  }
};

//verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  //check token exist
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      //check the given phone number matches and also check tokcen is not expired
      if (phone === tokenData.phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

//Checks
handlers.checks = (data, callback) => {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};
//container for all the checks methods
handlers._checks = {};

//Checks - post
//Required data :protocol,url,method,successCodes,timeoutSeconds
//Optional data:none
handlers._checks.post = (data, callback) => {
  //validate incoming data
  let protocol =
    typeof data.payload.protocol === "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url === "string" && data.payload.url.trim().length > 0
      ? data.payload.url
      : false;
  let method =
    typeof data.payload.method === "string" &&
    data.payload.method.trim().length > 0
      ? data.payload.method
      : false;
  let successCodes =
    Array.isArray(data.payload.successCodes) &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  let timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    //check authroised user logged in
    //get the token from header
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;
    //then check token exist
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;
        //check user exists related to that token
        _data.read("users", userPhone, (err, userData) => {
          if (!err && userData) {
            var userChecks = Array.isArray(userData.checks)
              ? userData.checks
              : [];
            //now verify if the user has less than number of max checks recommnended
            if (userChecks.length < config.maxChecks) {
              //create random id for new check
              var checkId = helpers.createRandomString(20);
              //create the check object including the user's phone
              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
              };
              //save the new check
              _data.create("checks", checkId, checkObject, err => {
                if (!err) {
                  //add the new checkid to the userdata
                  userData.checks = [...userChecks, checkId];
                  //now update the user record
                  _data.update("users", userPhone, userData, err => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "could not update the user with then new check"
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "could not create new check" });
                }
              });
            } else {
              callback(400, {
                Error: `User has already reached maximum no of checks ${
                  config.maxChecks
                }`
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputts or invalid inputs!" });
  }
};

//Checks - get
//Required data :checkId
//Optional data:none
handlers._checks.get = (data, callback) => {
  //check for valid id
  var id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //verify whether there is a check exist
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        //first get the token from the header
        var token =
          typeof data.headers.token === "string" &&
          data.headers.token.length === 20
            ? data.headers.token
            : false;
        //verify that given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, isValid => {
          if (isValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
      }
    });
  } else {
    callback(400, { Error: "Invalid check id ..!!!" });
  }
};

//Checks - put
//Required data :checkId
//Optional data:protocol,url,method,successCodes,timeoutSeconds(one of must be sent)
handlers._checks.put = (data, callback) => {
  //check for valid id
  var id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //validate incoming data
    let protocol =
      typeof data.payload.protocol === "string" &&
      ["http", "https"].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;
    let url =
      typeof data.payload.url === "string" && data.payload.url.trim().length > 0
        ? data.payload.url
        : false;
    let method =
      typeof data.payload.method === "string" &&
      data.payload.method.trim().length > 0
        ? data.payload.method
        : false;
    let successCodes =
      Array.isArray(data.payload.successCodes) &&
      data.payload.successCodes.length > 0
        ? data.payload.successCodes
        : false;
    let timeoutSeconds =
      typeof data.payload.timeoutSeconds === "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;
    if (protocol || url || method || successCodes || timeoutSeconds) {
      //first verify checkid exists
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          //get the token from header
          var token =
            typeof data.headers.token === "string" ? data.headers.token : false;
          //verify that given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, isValid => {
            if (isValid) {
              //update the check content
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              //store the update
              _data.update("checks", id, checkData, err => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "check data can not be updated!!" });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { Error: "Check id does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing required inputs or invalid inputs!" });
    }
  } else {
    callback(400, { Error: "Invalid check id ..!!!" });
  }
};
//Checks-delete
//Required Data : check id
handlers._checks.delete = (data, callback) => {
  //check for valid id
  var id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //verify whether check id exist
    _data.read("checks", id, (error, checkData) => {
      if (!error && checkData) {
        //get the token from header
        var token =
          typeof data.headers.token === "string" ? data.headers.token : false;
        //verify that given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, isValid => {
          if (isValid) {
            //delete the selected check
            _data.delete("checks", id, err => {
              if (!err) {
                //get the user details of of the relevant user
                _data.read("users", checkData.userPhone, (error, userData) => {
                  if (!error && userData) {
                    //remove the id from user's check array
                    userData.checks = userData.checks.filter(
                      checkid => checkid !== id
                    );
                    //update the user details
                    _data.update("users", userData.phone, userData, err => {
                      if (!err) {
                        callback(200);
                      } else {
                        callback(500, {
                          Error: "User details could not update"
                        });
                      }
                    });
                  } else {
                    callback(500, {
                      Error: "could not find the specified user"
                    });
                  }
                });
              } else {
                callback(500, { Error: "Selected check can not be deleted!" });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: "Check id does not exist!" });
      }
    });
  } else {
    callback(400, { Error: "Invalid check id ..!!!" });
  }
};
//export the module
module.exports = handlers;
