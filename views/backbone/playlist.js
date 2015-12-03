import Backbone from 'backbone';
import _ from 'lodash';
import template from '../handlebars/playlist.handlebars';
import Handlebars from 'handlebars/runtime';

// Pass in a Playlist model to create
var PlaylistView = Backbone.View.extend({
	events: {
		'click .panel-heading': 'collapse',
		'click .delete': 'deletePlaylist',
		'click .edit': 'editName',
		'click tr': 'goToYoutube'
	},

	initialize: function(options) {
		// When true, shows delete button
		this.editable = options.editable;
		this.username = options.username;
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

	goToYoutube: function(ev) {
		var youtube = $(ev.target).find('a').attr('href')
		if (youtube) {
			var win = window.open(youtube, '_blank');
  			win.focus();
		}
	},

	render: function() {
		var tplData = this.model.toJSON();
		tplData.editable = this.editable;
		tplData.encodedName = encodeURI(tplData.name);
		tplData.username = encodeURI(this.username);
		_.each(tplData.songs, function(song, i) {
			tplData.songs[i] = _.clone(song);
			tplData.songs[i].youtube = 'http://www.youtube.com/results?search_query=' + song.artist.replace(' ', '+') + '+' + song.name.replace(' ', '+');
		});

		Handlebars.registerHelper("inc", function(value, options)
		{
		    return parseInt(value) + 1;
		});


		this.$el.empty();
		this.$el.append(template(tplData));
	}
});

export default PlaylistView