import Vue from 'vue';
import Vuex from 'vuex';
import { updateData, setup, hideSingletons, runLayout, loadData } from '../d3chart.js';

Vue.use(Vuex);

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
          // todo consider putting these side-effects in an action
          // (and don't call this mutation directly - except through action)
          loadData(json);
          runLayout(state.currentLayout);
          return json;
        });
      });
    },
    hideSingletons ({commit, state}) {
      const validNodeIds = state.links.reduce((memo, link) => {
        memo.add(link.source.id);
        memo.add(link.target.id);
        return memo;
      }, new Set());
      const newNodes = state.nodes.filter(node => validNodeIds.has(node.id));
      commit('setDataView', {nodes: newNodes, links: state.links});
      // todo consider putting these side-effects in an action
      // (and don't call this mutation directly - except through action)
      console.log(state.dataView);
      loadData(state.dataView);
      runLayout(state.currentLayout);
    },
    setupChart ({commit}, elemId) {
      const svg = setup(elemId);
      commit('setChart', svg);
    },
    runLayout: (state, type) => runLayout(type)
  }
});
