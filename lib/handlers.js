/**
 * Request Handlers
 */
//Dependencies

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

handlers.users = (data, callback) => {};

module.exports = handlers;
