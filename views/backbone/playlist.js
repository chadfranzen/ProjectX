import Backbone from 'backbone';
import _ from 'lodash';
import template from '../handlebars/playlist.handlebars';
import Handlebars from 'handlebars/runtime';

// Pass in a Playlist model to create
var PlaylistView = Backbone.View.extend({
	events: {
		'click .panel-heading': 'collapse',
		'click .delete': 'deletePlaylist',
		'click .edit': 'editName'
	},

	initialize: function(options) {
		// When true, shows delete button
		this.editable = options.editable;
	},

	collapse: function() {
		$(this.el).find('.panel-collapse').collapse('toggle');
	},

	deletePlaylist: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		this.$el.fadeOut();
		this.model.deletePlaylist();
	},

	editName: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		var newName = prompt('Enter a new name for this playlist', this.model.get('name'));
		this.model.editName(newName);
	},

	render: function() {
		var tplData = this.model.toJSON();
		tplData.editable = this.editable;

		Handlebars.registerHelper("inc", function(value, options)
		{
		    return parseInt(value) + 1;
		});


		this.$el.empty();
		this.$el.append(template(tplData));
	}
});

export default PlaylistView