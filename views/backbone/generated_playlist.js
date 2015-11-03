import Backbone from 'backbone';
import PlaylistView from './playlist.js';

// A wrapper for a playlist view, to be used when we first generate a playlist on the home page
var GeneratedPlaylistView = Backbone.View.extend({
	events: {
		'click .btn-primary': 'save' 
	},

	save: function() {
		var name = prompt('Enter a name for your playlist', 'My New Playlist');
		this.model.set('name', name);
		$.post('/save', {playlist: this.model.toJSON()})
		 .then(() => {window.location.href = '/profile'});
	},
	
	className: 'generated-playlist',

	initialize: function() {
		this.playlistView = new PlaylistView({model: this.model});
	},

	render: function() {
		this.$el.empty();
		this.$el.append($("<h3>Here's your new playlist:</h3>"));
		this.playlistView.render();
		this.$el.append(this.playlistView.$el);
		this.$el.append($('<a href="/"><button class="btn btn-info">Try Again</button></a>'));
		this.$el.append($('<button class="btn btn-primary">Save it!</button>'));
	}
});

export default GeneratedPlaylistView;