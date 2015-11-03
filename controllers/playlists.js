var pg = require('pg');
var _ = require('lodash');
var conString = process.env.DATABASE_URL || "postgres://aashna956:Charu@956@localhost:5432/projectx";
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
			songs: rows.slice(0, songCount)
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

	playlistName = playlist.name;
	songs = playlist.songs;
	username = req.user.username;

	client.connect();
	client.query("SELECT * FROM Playlist WHERE name='" + playlist.name + "'", function(err, result){
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
			return "('" + [song.name, song.artist, playlistName, username].join("', '") + "')";
		}).join(", ");

		client.query("INSERT INTO Playlist VALUES ($1, $2)", [playlistName, username]);
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
		username = req.user.username,
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

				// TODO: make it so that songs don't have a 'playlistname' attribute on them;
				// it doesn't break anything but it's useless to front end
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