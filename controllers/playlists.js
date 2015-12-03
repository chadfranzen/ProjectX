var pg = require('pg');
var _ = require('lodash');
var conString = process.env.DATABASE_URL || "postgres://aashna956:Charu@956@localhost:5432/projectx";
var async = require('async');

exports.createTable=function(req,res){
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query("CREATE TABLE songs"+
									"("+
										"name character varying(50),"+
										"artist character varying(60)"+
									");");
	query.on("end", function(result){
		client.end();
		res.write('Table Schema Created');
		res.end();
	});
};
exports.addRecord=function(req, res){

        var client = new pg.Client(conString);

        client.connect();
        var query = client.query("insert into	songs (name, artist) "+ 
                               "values ('"+'random song'+"','"+ 'random artist'+"')");
    
        query.on("end", function (result) {          
            client.end(); 
            res.write('Success');
            res.end();  
        });

   };
exports.dropTable=function(req,res){
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query("DROP TABLE songs");
	query.on("end", function (result) {
		client.end();
		res.write('Success');
		res.end();
        });
};

/**
 * Generates a new playlist and sends it as a JSON blob
 * req.query should contain:
 * {songCount: <Number>, songMood: <String>}
 */
exports.generate=function(req, res){
	var client = new pg.Client(conString),
		songCount = req.query.songCount,
		songMood = req.query.songMood;
	client.connect();
	client.query('SELECT name, artist FROM Song WHERE ' + songMood + ' > 50', function(err, result){
		var rows = result.rows;
		// Randomize it a bit
		rows = _.shuffle(rows);

		res.send({
			name: '',
			songs: rows.slice(0, songCount),
			mood: songMood
		});

		client.end();
	});
};

/**
 * Saves a playlist
 * req.body.playlist should contain the playlist data as JSON
 */
exports.save=function(req, res){
	var client = new pg.Client(conString),
		playlist = req.body.playlist;

	if (!playlist || !req.user.username) {
		res.sendStatus(400);
		return;
	}

	var playlistName = playlist.name,
		songs = playlist.songs,
		mood = playlist.mood,
		username = req.user.username;

	client.connect();
	client.query("SELECT * FROM Playlist WHERE name='" + playlist.name.replace("'","''") + "' AND owner='" + username.replace("'","''") + "'", function(err, result){
		// Check to make sure there's not already a playlist with this name
		if (err || !_.isEmpty(result.rows)) {
			client.end();
			console.log(err);
			res.sendStatus(400);
			return;
		}

		var values = _.map(songs, function(song) {
			// Wacky wild string building happens here
			// It really works I promise
			return "('" + [song.name.replace("'","''"), song.artist.replace("'","''"), playlistName.replace("'","''"), username.replace("'","''")].join("', '") + "')";
		}).join(", ");
		client.query("INSERT INTO Playlist VALUES ($1, $2, $3)", [playlistName, username, mood]);
		client.query("INSERT INTO PartOf VALUES " + values, function(err) {
			client.end();
			console.log(err);
			if (err) {
				res.sendStatus(400);
			} else {
				res.sendStatus(200);
			}
		});
	});
};

exports.fetch=function(req, res){
	var client = new pg.Client(conString),
		username = req.query.username || req.user.username,
		playlistNames = [],
		playlists = [];

	if (!username) {
		res.sendStatus(400);
		return;
	}

	// First we get the names of playlists associated with this user
	// Then we get all the songs for those playlists and package them up into nice JSON
	client.connect();
	client.query("SELECT DISTINCT Playlist.name FROM Playlist WHERE owner = $1", [username], function(err, result) {
		if (err) {
			client.end();
			res.sendStatus(400);
			return;
		}
		_.each(result.rows, function(playlist) {
			playlistNames.push(playlist.name);
		});

		client.query("SELECT Playlist.name AS playlistname, songname AS name, artistname AS artist FROM Playlist, PartOf WHERE Playlist.owner=$1 AND Playlist.owner=PartOf.playlistowner AND Playlist.name=PartOf.playlistname", [username], function(err, result) {
			if (err) {
				client.end();
				res.sendStatus(400);
				return;
			}

			// For each playlist name, get the songs associate with that playlist
			// Then put that array into the playlist's "songs" property
			// And push it into the overall "playlists" result
			_.each(playlistNames, function(playlistname) {
				var playlist = {name: playlistname};

				playlist.songs = _.where(result.rows, {playlistname: playlistname})
				playlists.push(playlist);
			});

			res.send(playlists);
			client.end();
		});
	});
};

exports.deletePlaylist=function(req, res){
	var client = new pg.Client(conString),
		username = req.user.username,
		playlistName = req.params.playlistname;

	if (!username || !playlistName) {
		res.sendStatus(400);
		return;
	}

	client.connect();
	// Since PartOf references Playlist with a foreign key, this should delete stuff from PartOf too
	client.query("DELETE FROM Playlist WHERE owner=$1 AND name=$2", [username, playlistName], function(err) {
		if (err) {
			res.sendStatus(400);
		} else {
			res.sendStatus(200);
		}
		client.end();
	});
};

exports.editPlaylistName=function(req, res){
	var client = new pg.Client(conString),
		username = req.user.username,
		oldName = req.query.old,
		newName = req.query.new;

	if (!oldName || !newName || !username) {
		console.log('broke early');
		res.sendStatus(400);
		return;
	}

	// Since PartOf references Playlist with a foreign key, this should update stuff in PartOf too
	client.connect();
	client.query("UPDATE Playlist SET name=$1 WHERE owner=$2 AND name=$3", [newName, username, oldName], function(err) {
		if (err) {
			console.log(err);
			res.sendStatus(400);
		} else {
			res.sendStatus(200);
		}
		client.end();
	});

};
exports.getSimilarPlaylists = function(req,res){

		var client = new pg.Client(conString);
		var playlist_name = req.params.playlistname,
		playlist_owner = req.params.username,
		playlistNames = [],
		playlists = [],
		similar_playlists=[],
		curr_sums=[],
		other_sums=[],
		diffs=[],
		i=0,
		moods =  ["happy","sad", "party", "chill", "focus", "workout"];	
		client.connect();
		/* async.series() executes all these functions synchronously */
		async.series([
		function(callback){
			/* check if such a playlist exists */
			client.query("SELECT name FROM playlist WHERE name='"+playlist_name.replace("'","''")+"' AND owner='"+playlist_owner+"'", function(err,result){
				if(result.rowCount==0) {
					console.log("no such playlist");
					res.sendStatus(400);
					client.end();
					return;
				}
			});
			/* if it exists, then get all it's songs */
			var curr_playlist = {name: req.params.playlistname}; // we want to find similar playlists to this one
			client.query("SELECT Playlist.name AS playlistname, songname AS name, artistname AS artist FROM Playlist, PartOf WHERE Playlist.name = $1 AND Playlist.owner = $2 AND Playlist.owner=PartOf.playlistowner AND Playlist.name=PartOf.playlistname", [playlist_name, playlist_owner], function(err, result) {
				if (err) {
				client.end();
				return;
				}
				curr_playlist.songs = _.where(result.rows, {playlistname: playlist_name});
				callback();
			});
		},
		/* get all other playlists in the database, store the names in playlistNames[] */
		function(callback){
			client.query("SELECT Playlist.name AS playlistname, Playlist.owner AS owner FROM Playlist WHERE Playlist.name <> $1", [playlist_name], function(err, result) {
				if (err) {
				client.end();
				return;
				}
				_.each(result.rows, function(item){	
					playlistNames.push({name: item.playlistname, owner: item.owner});
				});
				playlistNames = _.shuffle(playlistNames);
				callback();
			});
		},
		/* get the songs for each playlist in playlistNames[], and then store in playlists[] */
		function(callback){
			client.query("SELECT Playlist.name AS playlistname, Playlist.owner AS owner, songname AS name, artistname AS artist FROM Playlist, PartOf WHERE Playlist.name <> $1 AND Playlist.owner=PartOf.playlistowner AND Playlist.name=PartOf.playlistname", [playlist_name], function(err, result) {
					if (err) {
						client.end();
						return;
					}
					_.each(playlistNames, function(playlistInfo) {
						var playlist = {name: playlistInfo.name, owner: playlistInfo.owner};
						playlist.songs = _.where(result.rows, {playlistname: playlistInfo.name, owner: playlistInfo.owner});
						playlists.push(playlist);
					});
				callback();				
			});
		},
		/* sum up the scores for each song in the playlist. curr_sums will look like ["happy": 375, "sad": 80]*/
		function(callback){
			async.forEach(moods, function(mood,callback){
				client.query("SELECT SUM("+mood+")/COUNT("+mood+") as sum FROM song, partof where song.name=partof.songname and partof.playlistname = $1 and partof.playlistowner = $2",[playlist_name, playlist_owner], function(err,result){
					if (err) {							
						client.end();
						return;
					}					
					curr_sums[mood]=result.rows[0].sum; /* curr_sums refers to the sum of scores of songs in curr_playlist */
					callback();
				});
			}, function(err){
				if(err) return next(err);
				callback();
			});
		},
		/* now sum up the scores of songs in all other playlists and compare with curr_sums */
		function(callback){
			/* dosomething1 (sorry about the name !) is called below, on every single item in playlists[] */
			var dosomething1 = function(item){
			/* so item is a playlist in playlists[]*/
			async.each(moods,function(mood){
			/* for every mood in moods[] we find the sum of the scores of the songs in "item" */
			client.query("SELECT SUM("+mood+")/COUNT("+mood+") as sum FROM song, partof where song.name=partof.songname and partof.playlistname = $1 and partof.playlistowner = $2",[item.name, item.owner], function(err,result){
				if (err) {							
				client.end();
				return;
				}
				other_sums[mood]=result.rows[0].sum;
				/* now find the difference in the scores of this playlist and "curr_playlist" */
				var diff = curr_sums[mood]-other_sums[mood];
				if(diff<0) diff = diff*(-1);
				diffs.push(diff);
				/* and the total */
				if(mood=="workout"){
					// else if it's less, and we've reached the last mood in moods[] ie "sad" for now
					// then the playlists are similar
					item.score = _.reduce(diffs, function(memo, num){ return memo + num; }, 0);
					if (item.score < 80) {
						similar_playlists.push(item);
						console.log("push item"+i+ "for mood"+mood);
						i++;
					}
					diffs = [];
				}
				if(i==3) {		// if we've found 3 similar playlists we render them as json to the response
					similar_playlists = _.sortBy(similar_playlists, 'score');
					res.json(similar_playlists);
					client.end();
					// the reason i did this is because client.end() needs to be inside this function, and i couldn't
					// see another way of doing it without the code breaking
				}
			});
			}, function(err){
				if(err) return;
			});
		};
		// for every playlist in playlists call dosomething1 (again, sorry about the name)
		async.each(playlists, dosomething1, function(err){
			if(err) return;
			callback();
		});
	}], function(err){
		if(err) return next(err);
	});
};

exports.getSimilarUsers = function(req, res){

	var client = new pg.Client(conString);
	var username = req.params.username;
	var givenUserMoods = {
			name : username,
			happy : 0,
			sad : 0,
			party : 0,
			chill : 0,
			focus : 0,
			workout : 0
		};
	var otherUsers = [];
	var otherUserMoods = [];
	var results = [];
	var moods = ["happy","sad","party","chill","focus","workout"];
	var moodScores = [];

		client.connect();
		async.series([
			//check if such a user exists
			function(callback){
				client.query("SELECT username FROM users WHERE username='"+username+"'", function(err, result){
					if(result.rowCount == 0) {
						console.log("no such user");
						res.sendStatus(400);
						client.end();
						return;
					}
				});
			//if user exists, then get the associated playlist moods for the given user
				client.query("SELECT mood FROM Playlist WHERE owner='"+username+"'", function(err, result){
					if(err){
						client.end();
						return;
					}

					if(result.rowCount == 0){
						console.log("user does no own a playlist");
						res.sendStatus(400);
						client.end()
						return;
					}

					_.each(result.rows, function(playlist){
						var emotion = playlist.mood;
						// console.log(emotion);
						givenUserMoods[emotion]++;
					});
					callback();
					// console.log(givenUserMoods);
				});
			},

			//get all the other users in the database
			function(callback){
				client.query("SELECT DISTINCT owner FROM Playlist WHERE owner <> $1", [username], function(err, result){
					if(err){
						client.end();
						return;
					}
					_.each(result.rows, function(otherUser){
						otherUsers.push(otherUser.owner); //could be 0 or more
					});
					otherUsers = _.uniq(otherUsers)
					callback()
				});
			},

			//for each user, get their playlist moods, store it in object, push in array
			//otherUser is a user from the otherUsers array
			function(callback){
				_.each(otherUsers, function(otherUser, i){
					client.query("SELECT mood FROM playlist WHERE owner = $1", [otherUser], function(err, result){
						if(err){
							client.end();
							return;
						}
						var otherUserMood = { name: otherUser, happy : 0, sad : 0, party : 0, chill : 0, focus : 0,workout : 0};
						_.each(result.rows, function(playlist){
							var emotion = playlist.mood
							otherUserMood[emotion]++;
						});
						otherUserMoods.push(otherUserMood);
						// We're done getting all the moods if this is the last user in the array
						if (i == otherUsers.length-1) {
							callback();
						}
					});
				});
			},

			//compare given user results with other user results 
			function(callback){
				var getSum = function(moodsObj) {
						var sum = 0;
						_.each(moods, function(mood) { 
							sum += moodsObj[mood]; 
						});
						return sum;
					},
					numGivenUserPlaylists = getSum(givenUserMoods);

				// Adjust mood counts so that they are an average weighted against the total # of playlist
				_.each(moods, function(mood){
					givenUserMoods[mood] /= numGivenUserPlaylists;
				});

				_.each(otherUserMoods, function(userMoods) {
					var numUserPlaylists = getSum(userMoods),
						otherUsername = userMoods.name,
						diffs = {},
						score;

					// Adjust mood counts so that they are an average weighted against the total # of playlist
					_.each(moods, function(mood) {
						userMoods[mood] /= numUserPlaylists;
						diffs[mood] = Math.abs(userMoods[mood] - givenUserMoods[mood]);
					});

					// Max diff sum is 6 so this will give us a score out of 100
					score = Math.floor((getSum(diffs) / 6) * 100);
					results.push({name: otherUsername, score: score});
				});
				// This will randomly select 3 of the 6 most similar users to send back
				results = _.take(_.shuffle(_.take(_.sortBy(results, 'score'), 6)), 3);
				res.json(results);
				client.end();		
		}], function(err){
			if(err) return next(err);
		});
};