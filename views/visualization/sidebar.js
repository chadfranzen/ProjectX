import Backbone from 'backbone';
import PlaylistView from '../backbone/playlist.js';

var Sidebar = Backbone.View.extend({
	events: {
		'click .btn-primary': 'getSimilar'
	},
	
	initialize: function(options) {
		_.bindAll(this, 'getSimilar');
		this.node = options.node;
		this.graph = options.graph;
		this.onFetch = options.onFetch;
		this.fetched = !_.isEmpty(_.where(this.graph.links(), {target: this.node}));
		this.username = this.model.get('songs')[0].owner;
		this.playlistView = new PlaylistView({model: this.model});
		this.render();
	},

	getSimilar: function() {
		var name = encodeURI(this.model.get('name')),
			self = this;

		$.get('/playlists/' + encodeURI(this.username) + '/' + name).done(function(res) {
			_.each(res, function(child) {
				self.graph.nodes().push(child);
				self.graph.links().push({source: child, target: self.node});
				self.onFetch();
			});
		});
		this.fetched = true;
		this.render();
	},

	render: function() {
		this.$el.empty();
		this.$el.append($('<h3>' + this.username + '</h3>'))
		this.playlistView.render();
		this.$el.append(this.playlistView.$el);
		this.$el.append($('<a href="/profile/' + encodeURI(this.username) + '"><button class="btn btn-info">Visit Profile</button></a>'));
		if (!this.fetched) {
			this.$el.append($('<button class="btn btn-primary">Find Similar</button>'));
		}
	}
});

export default Sidebar;