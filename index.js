/**
 * Primary file for the uptime monitor API
 *
 */
//Dependencies
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
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
    //send the response
    res.end("Hello world\n");
    console.log("Request received with this paylod ", buffer);
  });
});
//start the server
server.listen(3000, () => {
  console.log(`Server is listenning on port 3000`);
});
