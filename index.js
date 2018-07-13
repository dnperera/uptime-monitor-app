/*Dependencies*/
const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./lib/config");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

//instantiarting http server
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

//Start the http server
httpServer.listen(config.httpPort, () => {
  console.log(
    `Server is listening on poart ${config.httpPort} in ${config.envName}`
  );
});

var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};
//Instantiate https server
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});
//start the https server
httpsServer.listen(config.httpsPort, () => {
  console.log(
    `Server is listening on poart ${config.httpsPort} in ${config.envName}`
  );
});

//All the common server logic for http and https
var unifiedServer = (req, res) => {
  //get the url and parse it
  var parsedUrl = url.parse(req.url, true);
  //get the path name requested
  var path = parsedUrl.pathname;
  //get the path trimmed
  var trimmedPath = path.replace(/^\/+|\/+$/g, ""); // trim '/' from both sides
  //get the http method
  var method = req.method.toLowerCase();

  //get the incoming request query string
  var queryStringObject = parsedUrl.query;

  //get the headers
  var headers = req.headers;

  //get the payload if there is any
  var decorder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", data => {
    buffer += decorder.write(data);
  });
  req.on("end", () => {
    buffer += decorder.end();

    //choose the handler that request should go to otherwise if the route not foind, use the not found
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;
    //construct the data object to send to the handler
    var data = {
      trimmedPath: trimmedPath,
      method: method,
      queryStringObject: queryStringObject,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };
    //Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      //use the status code called back by the handler or default to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      //use the payload  called back by the handler or defailt to {}
      payload = typeof payload === "object" ? payload : {};

      //Convert the called back payload to a string to send back to the user
      var payloadString = JSON.stringify(payload);

      //Return the response
      res.setHeader("content-type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("we are returnning", statusCode, payloadString);
    });
  });
};

//Define Request Router
var router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};
