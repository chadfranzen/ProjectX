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
      req.flash('errors', { msg: info.message });
      console.log("invalid");
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
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
  console.log("this is what i get");
  console.log(req.user);
  User
    .findOne({where: { username: req.params.username }})
    .then(function(user) {
      // Check to see if a user with the specified username exists
      if (!user) {
        req.flash('errors', { msg: 'User with that username does not exist.' });
        return res.redirect('/');
      }
      else{
          res.render('pages/profile', { username: user.username, index: false, profile: true});
        }
    });
};
