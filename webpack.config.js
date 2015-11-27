module.exports = {
    entry: {
    	index: "./views/backbone/entry_index.js",
    	profile: "./views/backbone/entry_profile.js",
        graph: "./views/visualization/graph.js"
    },
    output: {
        path: __dirname,
        filename: "public/script/[name]_bundle.js"
    },
    module: {
	  loaders: [
	    {
	      test: /\.jsx?$/,
	      exclude: /(node_modules|bower_components)/,
	      loader: 'babel'
	    },
        { 
            test: /\.handlebars$/,
            loader: "handlebars-loader"
        }
	  ]
	}
};