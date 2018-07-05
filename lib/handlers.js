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
  var tosAgreement = data.payload.tosAgreement === "true" ? true : false;

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
//users get
handlers._users.get = (data, callback) => {};
//users put
handlers._users.put = (data, callback) => {};
//users delete
handlers._users.delete = (data, callback) => {};
module.exports = handlers;
