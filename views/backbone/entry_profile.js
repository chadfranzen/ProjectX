import Playlists from '../../models/backbone/playlists.js';
import PlaylistsView from './playlists.js';
import _ from 'lodash';

$(document).ready(() => {
	var username = $('#username').text().trim(),
		currentuser = $('#currentuser').text().trim(),
		url;
	if (!username) {
		url = '/playlists';
	} else {
		url = '/playlists?username=' + encodeURI(username);
	}
	var playlists = new Playlists({url: url});

	// PlaylistsView will render itself in the right spot when it's ready
	var playlistsView = new PlaylistsView({collection: playlists});

	$.get('/following/' + encodeURI(username)).done(function(following) {
		_.each(following, function(followedUser) {
			$('#user-info').append($('<li class="list-group-item divider text-info"><a href="/profile/' + encodeURI(followedUser.followee) + '">' + followedUser.followee + '</a></li>'));
		});
	});

	$.get('/following/' + encodeURI(currentuser)).done(function(following) {
		if (_.isEmpty(_.where(following, {followee: username})) && currentuser !== username) {
			$('#username').append($('<div class="follow pull-right btn btn-warning">Follow</div>'));
			$('.follow').click(function() {
				$('.follow').hide();
				$.get('/follow/' + encodeURI(username));
			});
		}
	});
});