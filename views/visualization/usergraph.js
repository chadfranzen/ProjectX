// Template from http://bl.ocks.org/mbostock/1062288

var Playlist = require('../../models/backbone/playlist.js');
var UserSidebar = require('./usersidebar.js');
var _ = require('lodash');
var seedrandom = require('seedrandom');
var Rainbow = require('rainbowvis.js');
var width = parseInt(d3.select('body').style('width'), 10),
    height = parseInt(d3.select('body').style('height'), 10),
    root;
var rootName = _.last(window.location.pathname.split('/'));

var force = d3.layout.force()
    .linkDistance(120)
    .charge(-220)
    .gravity(.05)
    .size([width, height])
    .nodes([{"name": decodeURI(rootName)}])
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var nodes = force.nodes(),
    links = force.links(),
    link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

var colors = new Rainbow().setSpectrum('green', 'yellow', 'red').setNumberRange(0, 100);

update();
$.get('/users/' + rootName).done(function(res){
  _.each(res, function(playlist) {
    nodes.push(playlist);
    links.push({source: playlist, target: 0});
    update();
  });
});

function update() {
  link = link.data(links);

  link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("stroke", linkColor);

  // Update nodes.
  node = node.data(nodes);

  node.exit().remove();

  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

  nodeEnter.append("circle")
      .attr("r", 30);

  nodeEnter.append("text")
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  node.select("circle")
      .style("fill", color);

  force.start();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function linkColor(link) {
    console.log( colors.colorAt(link.source.score) );
    return "#" + colors.colorAt(link.source.score);
}

// From http://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function color(d) {
  var rand = seedrandom(d.name)() * Math.pow(255,3);
  for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((rand >> i++ * 8) & 0xFF).toString(16)).slice(-2));
  return colour;
}

function click(d) {
  if (d3.event.defaultPrevented) return; // ignore drag
  if (d3.event.defaultPrevented) return; // ignore drag
  var sidebar = new UserSidebar({
    node: d,
    graph: force,
    onFetch: update
  });
  $('#usersidebar').html(sidebar.$el);

  var width = parseInt(d3.select('body').style('width'), 10) - 400;
  force.size([width, height]);
  update();
}
