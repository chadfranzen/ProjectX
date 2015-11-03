import Backbone from 'backbone';
import _ from 'lodash';
import PlaylistView from './playlist.js';

// Pass in a Playlists collection to create
var PlaylistsView = Backbone.View.extend({
	initialize: function() {
		this.subviews = [];

		this.collection.on('reset', () => {
			this.createSubviews();
			this.render();
		});

		this.collection.fetch({reset: true});
	},

	createSubviews: function() {
		this.subviews = [];
		_.each(this.collection.models, (playlist) => {
			this.subviews.push(new PlaylistView({
				model: playlist, 
				editable: true
			}));
		});
	},

	// This thing is memory leaky and gross right now but whatever
	render: function() {
		var $container = $('#playlists');
		$container.empty();
		_.each(this.subviews, (subview) => {
			subview.render();
			$container.append(subview.$el);
		});
	}
});

export default PlaylistsView;