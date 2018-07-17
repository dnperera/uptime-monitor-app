/**
 * Library for storing and rotating logs
 */
//Dependencies
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

//container object for the module
const lib = {};
//base path for the logs folder
lib.baseDir = path.join(__dirname, "/../.logs/");
//Append a string to a file .Creare the file if it does not exist.
lib.append = (file, str, callback) => {
  //open the file for appending or creare new file if doea not exist
  fs.open(lib.baseDir + file + ".log", "a", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      //Append to the file and close it
      fs.appendFile(fileDescriptor, str + "\n", err => {
        if (!err) {
          fs.close(fileDescriptor, err => {
            if (!err) {
              callback(false);
            } else {
              callback("Error in closing the file that being append data");
            }
          });
        } else {
          callback("Error in appending to the file");
        }
      });
    } else {
      callback("Could not open the file for appending");
    }
  });
};
module.exports = lib;
