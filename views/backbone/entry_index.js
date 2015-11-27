import _ from 'lodash';
import Playlist from '../../models/backbone/playlist.js';
import GeneratedPlaylistView from './generated_playlist.js';

$(document).ready(() => {
	$('#playlist-form').submit((ev) => {
		ev.preventDefault();


		$('.well').fadeOut(500, () => {
			var request = {};
			_.each($('#playlist-form').serializeArray(), (input) => {
				request[input.name] = input.value;
			});
			
			$.get('/generate', request).done((playlistData) => {
				var playlist = new Playlist(playlistData),
					playlistView = new GeneratedPlaylistView({model: playlist});

				playlistView.render();
				$('.content').html(playlistView.$el);
			});
		});
	});
});