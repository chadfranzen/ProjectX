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
  following: Sequelize.INTEGER,
  followers: Sequelize.INTEGER
}, 
{timestamps: false,
instanceMethods: 
	{
	comparePassword: function(candidatePassword, cb){
		console.log("candidate pass:"+candidatePassword);
		console.log("other pass:"+this.password);
		bcrypt.compare(candidatePassword, this.password, cb);
		}
	}
}
);

User.beforeCreate(function(user, options,cb){
  	if (!user.changed('password'))
        return cb();
  	bcrypt.genSalt(10, function(err, salt) {
    	if (err) return cb(err);
    	bcrypt.hash(user.password, salt, null, function(err, hash) {
      		if (err) return next(err);
      		console.log(hash);
      		user.password = hash;
      		return cb(null, options);
      	});
    });
});

sequelize.sync();
module.exports=User;