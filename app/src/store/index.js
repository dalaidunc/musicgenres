import Vue from 'vue';
import Vuex from 'vuex';
import { loadData, restart, setup, zoomToNode } from '../d3chart.js';

Vue.use(Vuex);

function getNeighbours(node, links, direction) {
  const neighbours = {
    nodes: [node],
    links: []
  };
  links.forEach(link => {
    if (link.source.id === node.id && (!direction || direction === 'target')) {
      neighbours.nodes.push(link.target);
      neighbours.links.push(link);
    } else if (link.target.id === node.id && (!direction || direction === 'source')) {
      neighbours.nodes.push(link.source);
      neighbours.links.push(link);
    }
  });
  return neighbours;
}

export default new Vuex.Store({
  state: {
    nodes: null,
    links: null,
    currentLayout: 'standard',
    chart: null,
    dataView: null
  },
  getters: {
    nodes: state => state.nodes,
    links: state => state.links
  },
  mutations: {
    setDataView (state, data) {
      state.dataView = data;
    },
    setChart (state, svg) {
      state.chart = svg;
    },
    setNodes (state, nodes) {
      state.nodes = nodes;
    },
    setLinks (state, links) {
      state.links = links;
    }
  },
  actions: {
    getData ({commit, state}) {
      return fetch('/static/music-genres-d3.json').then(res => {
        return res.json().then(json => {
          commit('setNodes', json.nodes);
          commit('setLinks', json.links);
          commit('setDataView', json);
          loadData(json);
          return json;
        });
      });
    },
    focusNode ({state}, node) {
      const neighbours = getNeighbours(node, state.links);
      restart(neighbours);
      // and centre the node onto screen
      // TODO: how to work out when restart is finished?
      setTimeout(() => zoomToNode(node, 0), 0);
    },
    zoomToNode ({state}, node) {
      zoomToNode(node);
    },
    hideSingletons ({commit, state}) {
      const validNodeIds = state.links.reduce((memo, link) => {
        memo.add(link.source.id);
        memo.add(link.target.id);
        return memo;
      }, new Set());
      const nodes = state.nodes.filter(node => validNodeIds.has(node.id));
      restart({nodes, links: state.links});
      commit('setDataView', {nodes, links: state.links});
    },
    clickedNode ({commit}, node) {
      // TODO: update things with clicked node details
    },
    setupChart ({commit, dispatch}, elemId) {
      const svg = setup(elemId, dispatch);
      commit('setChart', svg);
    }
  }
});
