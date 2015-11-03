import Backbone from 'backbone';

var Playlist = Backbone.Model.extend({
	defaults: {
		name: '',
		songs: []
	},

	// Delete yourself and, if you're part of a collection, make that
	// collection refetch
	deletePlaylist: function() {
		var self = this;
		$.post(`/delete/${this.attributes.name}`).done(() => {
		 	if (self.collection) {
		 		self.collection.fetch({reset: true});
		 	}
		 });
	},

	// Change your name and, if you're part of a collection, make that
	// collection refetch
	editName: function(newName) {
		var self = this;
		$.post(`/edit?old=${this.attributes.name}&new=${newName}`).done(() => {
			if (self.collection) {
				self.collection.fetch({reset: true});
			}
		});
	}
});

export default Playlist;