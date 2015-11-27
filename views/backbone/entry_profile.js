import Playlists from '../../models/backbone/playlists.js';
import PlaylistsView from './playlists.js';
import _ from 'lodash';

$(document).ready(() => {
	var username = window.location.pathname.split('/')[2],
		url;
	if (!username) {
		url = '/playlists';
	} else {
		url = '/playlists?username=' + encodeURI(username);
	}
	var playlists = new Playlists({url: url});

	// PlaylistsView will render itself in the right spot when it's ready
	var playlistsView = new PlaylistsView({collection: playlists});
});