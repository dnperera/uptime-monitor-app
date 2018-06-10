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
  //Get the http metho
  const method = req.method.toLowerCase();
  //Get query string as an object
  const queryStringObject = parsedURL.query;
  console.log(queryStringObject);
  res.end(`Query String `);
});
//start the server
server.listen(3000, () => {
  console.log(`Server is listenning on port 3000`);
});
