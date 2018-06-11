/**
 * Library for storing and eiditing data
 */
//Dependencies
const fs = require("fs");
const path = require("path");
//container for the module to be exported
var lib = {};
//base path for the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

//write data to a file
lib.create = (dir, file, data, callback) => {
  //open a new file  for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (error, fileDescriptor) => {
      if (!error && fileDescriptor) {
        //convert json data to string format
        var stringData = JSON.stringify(data);
        //write incoming data to the newly open file and close it
        fs.writeFile(fileDescriptor, stringData, err => {
          if (!err) {
            fs.close(fileDescriptor, error => {
              if (!error) {
                callback(false);
              } else {
                callback("Error in closing new file");
              }
            });
          } else {
            callback("Error in writing to new file!");
          }
        });
      } else {
        callback("Could not create a new file,it may already exist");
      }
    }
  );
};
module.exports = lib;
