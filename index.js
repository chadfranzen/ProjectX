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
	response.render('pages/index', {index: true, profile: false});
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

app.get('/profile/:username', auth.getUser);
app.get('/generate', function(request, response) {
	// I stuck some dummy data in here, but this is the general format of
	// what this route should return.
	response.send({
		name: 'Test Playlist',
		songs: [
			{
				name: 'Hotline Bling',
				artist: 'Drake'
			},
			{
				name: 'Monster',
				artist: 'Kanye West'
			},
			{
				name: 'Poetic Justice',
				artist: 'Kendrick Lamar'
			}
		]
	});
});

app.get('/playlists', function(request, response) {
	// I stuck some dummy data in here, but this is the general format of
	// what this route should return.
	// Obviously this will be user-specific eventually
	response.send([
		{
			name: 'Test Playlist 1',
			songs: [
				{
					name: 'Hotline Bling',
					artist: 'Drake'
				},
				{
					name: 'Monster',
					artist: 'Kanye West'
				},
				{
					name: 'Poetic Justice',
					artist: 'Kendrick Lamar'
				}
			]
		},
		{
			name: 'Test Playlist 2',
			songs: [
				{
					name: 'Take On Me',
					artist: 'a-ha'
				},
				{
					name: 'Forever Young',
					artist: 'Alphaville'
				},
				{
					name: 'Billie Jean',
					artist: 'Michael Jackson'
				}
			]
		}
	]);
	//change this to set homepage
  response.render('pages/index');
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

exports.app = app;