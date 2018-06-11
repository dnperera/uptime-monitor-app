/**
 * Primary file for the uptime monitor API
 *
 */
//Dependencies
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const config = require("./config");
//create server
const server = http.createServer((req, res) => {
  //Get the url and parse it
  const parsedURL = url.parse(req.url, true);
  //Get the pathname
  const path = parsedURL.pathname;
  const trimedPath = path.replace(/^\/+|\/+$/g, ""); // trim begin and end slashes
  //Get query string as an object
  const queryStringObject = parsedURL.query;
  //Get the http method
  const method = req.method.toLowerCase();
  //Get the request header as an object
  const headers = req.headers;
  //Get the payload if any
  var decorder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", data => {
    buffer += decorder.write(data);
  });
  req.on("end", () => {
    buffer += decorder.end();
    //choose the route handler that request should goto.
    //if the route is not found use the nofound handler
    const chosenHandler =
      typeof router[trimedPath] !== "undefined"
        ? router[trimedPath]
        : handlers.notfound;

    //construct the data object to send to the handler
    const data = {
      trimedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer
    };
    //route the request specified in the router
    chosenHandler(data, (statusCode, payload) => {
      //if the status code is not defined default to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      //if the payload is not defined  default to empty object
      payload = typeof payload === "object" ? payload : {};
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));
      console.log("Returnning Response -->", statusCode, payload);
    });
  });
});
//start the server
server.listen(config.port, () => {
  console.log(
    `Server is listenning on port ${config.port} in ${config.envName} mode`
  );
});

//Define route handlers
const handlers = {};
handlers.sample = (data, callback) => {
  //callback executed with http status and a payload object
  callback(200, { name: "Dasith Perera" });
};
//Not found handler
handlers.notfound = (data, callback) => {
  callback(404);
};

//Define a request router
const router = {
  sample: handlers.sample
};
