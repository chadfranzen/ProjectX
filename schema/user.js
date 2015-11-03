var Sequelize = require('sequelize');
var pg = require('pg').native;
var PassportLocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var sequelize = new Sequelize(process.env.DATABASE_URL || "postgres://aashna956:Charu@956@localhost:5432/projectx",{ native: true });
sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  }, function (err) { 
    console.log('Unable to connect to the database:', err);
  });
var User = sequelize.define('user', {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
}, {timestamps: false});


sequelize.sync();
module.exports=User;