var passport = require('passport');
var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../schema/user.js');
var Sequelize = require('sequelize');
/*
 * GET /login
 * Login page.
 */
exports.getLogin = function(request, response) {
  //console.log(req);
  if (request.user) return response.redirect('/');
  response.render('pages/login');
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = function(req, res, next) {

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      console.log(req.password);
      console.log("invalid");
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      console.log("logging in");
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = function(request, response) {
  //if (req.user) return res.redirect('/');
  response.render('pages/signup');
  console.log('get ');
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = function(req, res, next) {

User.findOne({where: {username:req.body.username}})
  .then(function(user){
      if(user) {
          req.flash('errors', { msg: 'Account with that email address already exists.' });
          console.log("nope");
          return res.redirect('/signup');
        }
      else{
          var t_user = User.create({
            username: req.body.username,
            password: req.body.password,
            followers: 0,
            following: 0
        }).then(function(){
            req.logIn(t_user,function(err){
            if (err) return next(err);
            res.redirect('/');
            });
          });
      }
  });
};


/*** GET PROFILE ***/
exports.getUser = function(req, res) {
  // If no username is specified, go to the logged in user's profile
  if (!req.params.username) {
    req.params.username = req.user.username;
  }
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        return res.redirect('/');
      }
      else{
          res.render('pages/profile', { username: user.username, followers: user.followers, following: user.following, index: false, profile: true});
        }
    });
};

exports.addFollower = function(req,res){
  if(!req.params.username){
    req.params.username = require.user.username;
  }
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        return res.redirect('/');
      }
      else{
        console.log("maybe im here");
          req.params.followers +=1;
            res.render('pages/profile', { username: user.username, followers: user.followers, following: user.following, index: false, profile: true});
        }
    });
};