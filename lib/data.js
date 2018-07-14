/**
 * Library for storing and eiditing data
 */
//Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");
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

//Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(
    lib.baseDir + dir + "/" + file + ".json",
    "utf8",
    (error, data) => {
      if (!error && data) {
        var parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(error, data);
      }
    }
  );
};

//Update an existing file
lib.update = (dir, file, data, callback) => {
  //open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (error, fileDescriptor) => {
      if (!error && fileDescriptor) {
        var stringData = JSON.stringify(data);
        //Truncate the content of the file
        fs.ftruncate(fileDescriptor, error => {
          if (!error) {
            //update the file  with new data and close
            fs.writeFile(fileDescriptor, stringData, err => {
              if (!err) {
                fs.close(fileDescriptor, error => {
                  if (!error) {
                    callback(false);
                  } else {
                    callback("Error in closing the file!!!");
                  }
                });
              } else {
                callback("Error in writing new data to the existing file!.");
              }
            });
          } else {
            callback("Error truncating the file");
          }
        });
      } else {
        callback(
          "Could not open the file for updating, it may not exist yet!."
        );
      }
    }
  );
};

//Delete a file
lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", error => {
    if (!error) {
      callback(false);
    } else {
      callback("Error in deleting the file");
    }
  });
};

//list all file names of a given directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + "/", (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(name => {
        trimmedFileNames.push(name.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

module.exports = lib;
