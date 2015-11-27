import Backbone from 'backbone';
import Playlist from './playlist.js';

var Playlists = Backbone.Collection.extend({
	model: Playlist,
	initialize: function(options) {
		this.url = options.url;
	}
});

export default Playlists;