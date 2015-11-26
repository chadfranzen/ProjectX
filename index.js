var express = require('express');
var app = express();
var db = require('./controllers/playlists.js');
var flash = require("express-flash");
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var session = require('express-session');
var app = express();
var pg = require('pg');
var secrets = require('./secrets');
var passportConf = require('./config/passport');
var auth = require('./controllers/auth');
var pgSession = require('connect-pg-simple')(session);
app.set('port', (process.env.PORT || 5000));

// make express look in the public directory for assets (css/js/img)

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  store: new pgSession({
	pg : pg,                                  // Use global pg-module 
    conString : secrets.db,
    tableName : 'session'
  }),
  secret: secrets.sessionSecret,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(request, response, next) {
  response.locals.user = request.user;
  next();
});
// might have to change these setting to match backbone
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  if (!request.user) {
    response.redirect('/login');
  } else {
  	response.render('pages/index', {index: true, profile: false});
  }
});
/*** LOGIN STUFF ***/
app.get('/login',auth.getLogin);
app.post('/login', auth.postLogin);
app.get('/signup', auth.getSignup);
app.post('/signup', auth.postSignup);
app.get('/logout', auth.logout);
app.get('/db/addRecord', function(req,res){
    db.addRecord(req,res);
});

app.get('/db/createTable', function(req,res){
    db.createTable(req,res);
});
app.get('/db/dropTable', function(req,res){
    db.dropTable(req,res);
});

app.get('/profile/', auth.getUser);
app.get('/profile/:username', auth.getUser);

app.get('/generate', db.generate);

app.get('/playlists', db.fetch);

app.post('/save', db.save);

app.post('/delete/:playlistname', db.deletePlaylist);
app.get('/playlists/:playlistname', db.getSimilarPlaylists);

// ?old=< >&new=< >
app.post('/edit', db.editPlaylistName);

/** FOLLOWING **/
//app.post('/profile/:username', auth.addFollower);

/*****/
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

exports.app = app;