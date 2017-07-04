import * as d3 from 'd3';
import { restart, standard, dragCircle, stopLayout } from './layouts.js';

const zoom = d3.zoom().scaleExtent([0.1, 7]);
const nominalTextSize = 10;
const nominalStroke = 1.5;
const nominalNodeSize = 8;
const maxTextSize = 24;
const maxStroke = 4.5;
const maxNodeSize = 36;

const size = d3.scalePow().exponent(1)
  .domain([1,100])
  .range([8, 24]);

var svg,
  node,
  link,
  circle,
  centre,
  nodeLabels,
  data,
  textBackground;

export function updateData (newData) {
  data = newData;
  node = node.data(newData.nodes);
  node.exit().remove();

  link = link.data(newData.links);
  link.exit().remove();

  runLayout();
}

export function loadData (newData) {
  stopLayout();
  data = newData;

  node = svg.selectAll('.node')
  node = node
    .data(data.nodes)
  node.exit().remove()
  node = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .merge(node)

  link = svg.selectAll('.link')
  link = link
    .data(data.links)
  link.exit().remove();
  link = link
    .enter()
    .append('svg:line')
    .attr('class', 'link')
    .attr('marker-end', 'url(#end)')
    .merge(link);

  // link.exit().remove();

  // node.exit().remove();

  circle = node.append('svg:circle')
    .attr('r', 5)
    .call(dragCircle);
  nodeLabels = node.append('svg:text')
    .attr('class', 'node-label')
    .attr('dy', 12)
    .attr('text-anchor', 'middle')
    .style('font-size', nominalTextSize + 'px')
    .text(function (d) {
      return d.label;
    })
    .call(getBBox)

  // create the arrowheads for links
  svg.append('defs').selectAll('marker')
    .data(['end'])
    .enter()
    .append('svg:marker')
    .attr('id', String)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', -1.5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  textBackground = node.insert('svg:rect')
    .attr('class', 'text-background')
    .attr('x', d => d.bbox.x)
    .attr('y', d => d.bbox.y)
    .attr('rx', 3)
    .attr('ry', 3)
    .attr('width', d => d.bbox.width + 6)
    .attr('height', d => d.bbox.height + 2)

  svg.call(zoom);
}

export function setup (elemId) {
  svg = d3.select(elemId).append('svg')
    .attr('width', '100%')
    .attr('height', '100%');

  // data.nodes.filter(node => !!node.label);

  zoom.on('zoom', () => {
    let { transform } = d3.event;
    node.attr('transform', transform);
    link.attr('transform', transform);
  });

  // console.log(data);
  // loadData(data.nodes, data.links);


  const width = document.querySelector(elemId).clientWidth;
  const height = document.querySelector(elemId).clientHeight;
  centre = {x: width / 2, y: height / 2};
  // standard(data.nodes, data.links, layoutTick, centre);

  // calculateDegrees(data.links);

  // setTimeout(() => hideSingletons(data), 200);

  return svg;

}

function getBBox (selection) {
  selection.each(function (d) {
    d.bbox = this.getBBox();
  });
}

function layoutTick() {
  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  circle
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  nodeLabels.attr('x', function (d) { return d.x; })
    .attr('y', function (d) { return d.y + 12; })
    .call(getBBox);

  textBackground.attr('x', d => d.bbox.x - 3)
    .attr('y', d => d.bbox.y - 1)

  //node.attr('transform', d => `translate(${d.x},${d.y})`);
  // node.attr('x', d => d.x);
  // node.attr('y', d => d.y);

  // node.attr("transform", function(d) {
  // return "translate(" + d.x + "," + d.y + ")";
  // });
  //nodeLabels.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function calculateDegrees (links) {
  const degrees = new Map();
  links.forEach(link => {
    [link.source.id, link.target.id].forEach(id => {
      const val = degrees.has(id) ? degrees.get(id) + 1 : 1;
      degrees.set(id, val);
    });
  });
  // log the top 10?
  const top10 = Array.from(degrees.entries()).sort(function (a, b) {
    return b[1] - a[1];
  }).slice(0, 10);
}

export function runLayout (type) {
  stopLayout();
  switch (type) {
    default:
      standard(data.nodes, data.links, layoutTick, centre);
  }
}

/*
 * export function hideSingletons ({nodes, links}) {
 *   const validNodeIds = links.reduce((memo, link) => {
 *     memo.add(link.source.id);
 *     memo.add(link.target.id);
 *     return memo;
 *   }, new Set());
 *   const newNodes = nodes.filter(node => validNodeIds.has(node.id));
 *   loadData(newNodes, links);
 *   runLayout('standard');
 * }
 */
