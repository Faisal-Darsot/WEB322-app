var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

var userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;
var uri =
  "mongodb+srv://fd818:Password101@senecaweb.9rg9oak.mongodb.net/?retryWrites=true&w=majority";

exports.initialize = function () {
  //console.log("in init function");
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      uri,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (error) {
        if (error) {
          //console.log(error);
          reject(error);
        } else {
          console.log("mongoose success");
          User = db.model("users", userSchema);
          resolve();
        }
      }
    );
  });
};

exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (
      userData.password.trim().length == 0 ||
      userData.password2.trim().length == 0
    )
      reject("Error: Password cannot be empty or only white spaces!");
    else if (userData.password != userData.password2)
      reject("Error: Passwords do not Match");
    else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;
          let newUser = new User(userData);
          newUser
            .save()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code === 11000) reject("User Name already taken");
              else reject("There was an error creating the user: " + err);
            });
        })
        .catch(() => {
          reject("There was an error encrypting the password");
        });
    }
  });
};

exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.findOne({ userName: userData.userName })
      .lean()
      .exec()
      .then((foundUser) => {
        if (!foundUser) reject("Unable to find user: " + userData.userName);
        else {
          bcrypt.compare(userData.password, foundUser.password).then((res) => {
            if (res === false)
              reject("Incorrect password for user: " + userData.userName);
            else {
              //using unshift so most recent login will be at beginning of array
              foundUser.loginHistory.unshift({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });
              //console.log((new Date()));
              User.updateOne(
                { userName: foundUser.userName },
                { $set: { loginHistory: foundUser.loginHistory } }
              )
                .then(() => {
                  console.log("update done");
                  resolve(foundUser);
                })
                .catch((err) => {
                  reject("There was an error verifying the user: " + err);
                });
            }
          });
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};
