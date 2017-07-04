import * as d3 from 'd3';

let sim = null;

export function restart (nodes, links, tickFn, centre) {
  sim.nodes(nodes);
  sim.force('link').links(links);
  sim.alpha(1).restart();
  // sim.restart();
}

export function standard (nodes, links, tickFn, centre) {
  console.log('standard layout', arguments);
  sim = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody())
    .force('link', d3.forceLink(links))
    .force('collision', d3.forceCollide(20))
    .force('center', d3.forceCenter(centre.x, centre.y));

  sim.nodes(nodes).on('tick', tickFn);

  sim.force('link').links(links);


}

export var dragCircle = d3.drag()
  .on('start', dragStart)
  .on('drag', dragging)
  .on('end', dragEnd)

function dragStart (d) {
  if (!d3.event.active) sim.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragging (d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnd (d) {
  if (!d3.event.active) sim.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

export function stopLayout () {
  if (sim) {
    sim.stop();
  }
}
