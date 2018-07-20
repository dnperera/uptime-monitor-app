/*Dependencies*/
const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const handlers = require("./handlers");
const helpers = require("./helpers");
//Instantiate the server module object
const server = {};

//instantiarting http server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
};
//Instantiate https server
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res);
  }
);

//All the common server logic for http and https
server.unifiedServer = (req, res) => {
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
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
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
    chosenHandler(data, (statusCode, payload, contentType) => {
      //Determine type of response depending on the contentType, default to json
      contentType = typeof contentType === "string" ? contentType : "json";
      //use the status code called back by the handler or default to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      //Renturn the response-parts that are content-specific
      var payloadString = "";
      if (contentType === "json") {
        res.setHeader("content-type", "application/json");
        //use the payload  called back by the handler or defailt to {}
        payload = typeof payload === "object" ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType === "html") {
        res.setHeader("content-type", "text/html");
        payload = typeof payload === "string" ? payload : "";
        payloadString = typeof payload === "string" ? payload : "";
      }
      //Return the response
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

//Define Request Router
server.router = {
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "checks/all": handlers.checkList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  ping: handlers.ping,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks
};

server.init = () => {
  //Start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      `Server is listening on poart ${config.httpPort} in ${config.envName}`
    );
  });

  //start the https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      `Server is listening on poart ${config.httpsPort} in ${config.envName}`
    );
  });
};
//export the server module
module.exports = server;
