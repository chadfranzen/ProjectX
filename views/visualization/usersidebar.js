import Backbone from 'backbone';

var UserSidebar = Backbone.View.extend({
	events: {
		'click .btn-primary': 'getSimilar'
	},
	
	initialize: function(options) {
		_.bindAll(this, 'getSimilar');
		this.node = options.node;
		this.graph = options.graph;
		this.onFetch = options.onFetch;
		this.fetched = false;
		this.username = this.node.name;
		this.render();
	},

	getSimilar: function() {
		var name = encodeURI(this.username),
			self = this;

		$.get('/users/' + name).done(function(res) {
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
		this.$el.append($('<h3>' + this.username + '</h3>'));
		this.$el.append($('<h4>You are ' + (100 - this.node.score) + '% similar</h2>'));
		this.$el.append($('<a href="/profile/' + encodeURI(this.username) + '"><button class="btn btn-info">Visit Profile</button></a>'));
		if (!this.fetched) {
			this.$el.append($('<button class="btn btn-primary">Find Similar</button>'));
		}
	}
});

export default UserSidebar;