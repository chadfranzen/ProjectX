var _ = require('lodash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var secrets = require('../secrets');
var User = require('../schema/user.js');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  User.find({ where: { username: user.username }}).then(function(){
    done(null, user);
  });
  });

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.find({ where: { username: username }}).then(function(user) {
      if (!user) {
        console("user not found");
        return done(null, false);
      } 
      console.log(this);
      user.comparePassword(password, function(err, isMatch){
        if(err) return done(err);
        if(!isMatch) { return done(null,false);
        }
        console.log("trying to log in");
        return done(null, user);
      });

    }).error(function(err){
      done(err);
    });
  }
));