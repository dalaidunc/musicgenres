import * as d3 from 'd3';

var svg, width, height, g, link, node, dragCircle, dispatch;

const zoom = d3.zoom().scaleExtent([0.1, 7]);

const nodeSize = 18;

var simulation, data;

// attempt #1 at zoom to fit
// TODO: a bit hacky, but the visual effect is not bad
setTimeout(function () {
  const bbox = g.node().getBBox();
  const scale = 0.85 / Math.max(bbox.width / width, bbox.height / height);
  const transform = d3.zoomIdentity
    .scale(scale)
    .translate(bbox.width, bbox.height / 2);
  svg.transition().duration(800).call(zoom.transform, transform);
}, 1000);

zoom.on('zoom', (...args) => {
  let { transform } = d3.event;
  const current = d3.zoomTransform(g.node());
  g.attr('transform', transform);
});

function setupLayout({ nodes, links }) {
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

function drawNode(nodeEnter) {
  const circle = nodeEnter
    .append("circle")
    .attr("r", nodeSize)
    .call(dragCircle)
  const nodeLabels = nodeEnter
    .append('text')
    .attr('class', 'node-label')
    .attr('dy', nodeSize + 12)
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
    .attr('width', d => d.bbox.width)
    .attr('height', d => d.bbox.height)
  return nodeEnter;
}

function clickedNode (d) {
  dispatch('clickedNode', d);
}

function getBBox(selection) {
  selection.each(function (d) {
    d.bbox = this.getBBox();
  });
}

function ticked() {
  node.attr('transform', d => `translate(${d.x}, ${d.y})`);

  // as the node size grows currently the arrowhead needs to change the marker width/height to match
  // TODO: how to set marker at right place given varying sized nodes?
  link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; })
  
}

export function loadData (data) {
  setupLayout(data);
  restart(data);
}

export function setup(id, boundDispatch) {
  const elem = document.getElementById(id);
  dispatch = boundDispatch;
  svg = d3.select(elem);
  // this method of getting width/height seems to work on both chrome and FF
  // unlike some other methods
  const bounds = elem.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link");
  node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");
  dragCircle = d3.drag()
    .on('start', dragStart)
    .on('drag', dragging)
    .on('end', dragEnd)

  function dragStart(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragging(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragEnd(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

export function zoomToNode (node) {
  const transform = d3.zoomIdentity
    .scale(1)
    .translate(width / 2 - node.x, height / 2 - node.y);
  svg.transition().duration(600).call(zoom.transform, transform, node);
}

export function restart({ nodes, links }) {

  // Apply the general update pattern to the nodes.
  node = node.data(nodes, function (d) { return d.id; });
  node.exit().remove();
  node = drawNode(node.enter().append('g').attr('class', 'node').on('click', clickedNode)).merge(node);

  // Apply the general update pattern to the links.
  link = link.data(links, function (d) { return d.source.id + "-" + d.target.id; });
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
    .attr('markerWidth', nodeSize + 4)
    .attr('markerHeight', nodeSize + 4)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
  svg.call(zoom);
}
