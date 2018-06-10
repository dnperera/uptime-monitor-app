/**
 * Primary file for the uptime monitor API
 *
 */
//Dependencies
const http = require("http");
const url = require("url");
//create server
const server = http.createServer((req, res) => {
  //Get the url and parse it
  const parsedURL = url.parse(req.url, true);
  //Get the pathname
  const path = parsedURL.pathname;
  const trimedPath = path.replace(/^\/+|\/+$/g, "");
  //Get query string as an object
  const queryStringObject = parsedURL.query;
  //Get the http method
  const method = req.method.toLowerCase();
  //Get the request header as an object
  const headers = req.headers;
  console.log(headers);
  res.end(`Query String `);
});
//start the server
server.listen(3000, () => {
  console.log(`Server is listenning on port 3000`);
});
