/**
 * Primary file for the api
 */
//Dependencies
const server = require("./lib/server");
const workers = require("./lib/workers");

//Declare the app
const app = {};
//init function
app.init = () => {
  //start the both http and https server
  server.init();
  //start the workers
  workers.init();
};

//Execute init method
app.init();

//Export the app module
module.exports = app;
