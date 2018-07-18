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

//List all the logs and optionally include compressed logs
lib.list = (includedCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(fileName => {
        //Add .log files to the array
        if (fileName.indexOf(".log") > -1) {
          trimmedFileNames.push(fileName.replace(".log", ""));
        }
        //Add compressed files ending .gz.b64
        if (includedCompressedLogs && fileName.indexOf(".gz.b64") > -1) {
          trimmedFileNames.push(fileName.replace(".gz.b64", ""));
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

//compress the content of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId, newFileId, callback) => {
  var sourceFile = logId + ".log";
  var compressedFile = newFileId + ".gz.b64";
  //Read the source file
  fs.readFile(lib.baseDir + sourceFile, "utf8", (err, inputString) => {
    if (!err && inputString) {
      //compress the data using gzip
      zlib.gzip(inputString, (error, buffer) => {
        if (!error && buffer) {
          //send the compressed data to the destination file
          fs.open(lib.baseDir + compressedFile, "wx", (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
              //Write tp the destination file
              fs.writeFile(fileDescriptor, buffer.toString("base64"), error => {
                if (!error) {
                  //Close the destination file
                  fs.close(fileDescriptor, er => {
                    if (!er) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(error);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(error);
        }
      });
    } else {
      callback(err);
    }
  });
};
//Decompress the content of .gz.b64 into a string
lib.decompress = (fileId, callback) => {
  var fileName = fileId + ".gz.b64";
  fs.readFile(lib.baseDir + fileName, "utf8", (err, str) => {
    if (!err && str) {
      //Decompress the data
      var inputBuffer = Buffer.from(str, "base64");
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          callback(outputBuffer.toString());
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

//Tuncate a log file
lib.truncate = (logId, callback) => {
  fs.truncate(lib.baseDir + logId + ".log", 0, err => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};
module.exports = lib;
