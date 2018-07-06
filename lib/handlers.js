/**
 * Request Handlers
 */
//Dependencies
const _data = require("./data");
const helpers = require("./helpers");
//Define route handlers
const handlers = {};
//Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};
//Not found handler
handlers.notfound = (data, callback) => {
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
//@TODO - only authenticated users can access own data

handlers._users.get = (data, callback) => {
  //check for valid phone number
  var phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //lookup the use
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
    callback(400, { Error: "Invalid phone number!!!" });
  }
};
//users put
//Required data :phone
//Optional :firstname,lastname,password(at least one field must be specified)
//@TODO - only authenticated users can access own data
handlers._users.put = (data, callback) => {
  //check for the required field
  var phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length === 10
      ? data.payload.phone.trim()
      : false;
  if (phone) {
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
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Invalid phone number." });
  }
};
//users delete
//Required : phone
//TODO  : only authenticated  user can delete
//TODO : delete anyother data files related to this user
handlers._users.delete = (data, callback) => {
  //check for the required field
  var phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //check user exist
    _data.read("users", phone, (error, userData) => {
      if (!error && userData) {
        _data.delete("users", phone, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Can not delete the specified user" });
          }
        });
      } else {
        callback(400, { Error: "User does not exist!!" });
      }
    });
  } else {
    callback(400, { Error: "Invalid phone number." });
  }
};
module.exports = handlers;
