var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    color = d3.scaleOrdinal(d3.schemeCategory10);

const zoom = d3.zoom().scaleExtent([0.1, 7]);

var simulation, data;

zoom.on('zoom', () => {
  let { transform } = d3.event;
  g.attr('transform', transform);
});

function setupLayout ({ nodes, links }) {
  simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-1000))
    .force("link", d3.forceLink(links).distance(200))
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force('collision', d3.forceCollide(20))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .alphaTarget(1)
    .on("tick", ticked);
}

var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
    link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
    node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");

(async () => {
  const response = await fetch('music-genres-d3.json');
  data = await response.json();
  setupLayout(data);
  restart(data);
})();

function hideSingletons () {
  const validNodeIds = data.links.reduce((memo, link) => {
    memo.add(link.source.id);
    memo.add(link.target.id);
    return memo;
  }, new Set());
  const nodes = data.nodes.filter(node => validNodeIds.has(node.id));
  restart({nodes, links: data.links});
}

document.querySelector('#single').addEventListener('click', e => {
  hideSingletons();
});

function drawNode (nodeEnter) {
  const circle = nodeEnter
    .append("circle")
    .attr("fill", function(d) { return color(d.id); })
    .attr("r", 8)
    .call(dragCircle)
  const nodeLabels = nodeEnter
    .append('text')
    .attr('class', 'node-label')
    .attr('dy', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .text(function (d) {
      return d.label;
    })
    .call(getBBox)
  const textBackground = nodeEnter
    .append('rect')
    .attr('class', 'text-background')
    .attr('x', d => d.bbox.x)
    .attr('y', d => d.bbox.y)
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('width', d => d.bbox.width + 6)
    .attr('height', d => d.bbox.height + 2)
  return nodeEnter;
}

function getBBox (selection) {
  selection.each(function (d) {
    d.bbox = this.getBBox();
  });
}

var dragCircle = d3.drag()
  .on('start', dragStart)
  .on('drag', dragging)
  .on('end', dragEnd)

function dragStart (d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragging (d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnd (d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function restart({ nodes, links }) {

  // Apply the general update pattern to the nodes.
  node = node.data(nodes, function(d) { return d.id;});
  node.exit().remove();
  node = drawNode(node.enter().append('g').attr('class', 'node')).merge(node);

  // Apply the general update pattern to the links.
  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("line")
    .attr('class', 'link')
    .attr('marker-end', 'url(#end)')
    .merge(link);

  // create the arrowheads for links
  g.append('defs').selectAll('marker')
    .exit()
    .data(['end'])
    .enter()
    .append('svg:marker')
    .attr('id', String)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', -1.5)
    .attr('markerWidth', 12)
    .attr('markerHeight', 12)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
  svg.call(zoom);
}

function ticked() {
  node.attr('transform', d => `translate(${d.x}, ${d.y})`);

  // as the node size grows currently the arrowhead needs to change the marker width/height to match
  // TODO: how to set marker at right place given varying sized nodes?
  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; })
/*
 *     .attr("x2", function(d) { 
 *       var diffX = d.target.x - d.source.x;
 *       var diffY = d.target.y - d.source.y;
 * 
 *       // Length of path from center of source node to center of target node
 *       var pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
 * 
 *       // x and y distances from center to outside edge of target node
 *       var offsetX = (diffX * 8) / pathLength;
 *       var offsetY = (diffY * 8) / pathLength;
 *       return d.target.x - offsetX; 
 *     })
 *     .attr("y2", function(d) { 
 *       var diffX = d.target.x - d.source.x;
 *       var diffY = d.target.y - d.source.y;
 * 
 *       // Length of path from center of source node to center of target node
 *       var pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
 * 
 *       // x and y distances from center to outside edge of target node
 *       var offsetX = (diffX * 8) / pathLength;
 *       var offsetY = (diffY * 8) / pathLength;
 *       return d.target.y - offsetY; 
 *     });
 */
}
