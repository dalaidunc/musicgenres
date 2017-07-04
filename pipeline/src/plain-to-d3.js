function parse (data) {
  const nodesDict = {};
  const nodes = [];
  const links = [];
  // Proces nodes
  Object.keys(data).forEach(key => {
    const g = data[key];
    if (g.label) {
      nodes.push(Object.assign({
        id: g.genre
      }, g));
    }
  });
  nodes.forEach((node, index) => {
    nodesDict[node.id] = index;
  });
  // Process links
  Object.keys(data).forEach(key => {
    const g = data[key];
    if (g.origins) {
      const target = nodesDict[g.genre];
      let sources = Array.isArray(g.origins) ? g.origins : [g.origins];
      sources.forEach(source => {
        const sourceIndex = nodesDict[source];
        links.push({
          source: sourceIndex,
          target
        });
      });
    }
    if (g.derivatives) {
      const source = nodesDict[g.genre];
      let targets = Array.isArray(g.derivatives) ? g.derivatives : [g.derivatives];
      targets.forEach(target => {
        const targetIndex = nodesDict[target];
        links.push({
          source,
          target: targetIndex
        });
      });
    }
  });
  return {nodes, links};
}

module.exports = parse;
