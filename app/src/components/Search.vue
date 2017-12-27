<template>
  <div>
    <form @submit.prevent='focus'>
      <input :disabled='isFocused' @input='doSearch' v-model='selectedNodeName' type='text' name='search' autocomplete="off" />
      <button type='submit'>Focus</button>
      <button type='button' @click='reset'>Reset</button>
    </form>
    <ul v-if='results.length && !isFocused'>
      <li @click="clickGenre(result)" :key="result.uri" v-for='result in results'>{{result.label}}</li>
    </ul>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "search",
  data() {
    return {
      isFocused: false,
      selectedNodeName: '',
      selectedNode: null,
      results: [],
      maxResults: Infinity
    };
  },
  computed: {
    ...mapGetters(["nodes"])
  },
  methods: {
    ...mapActions(["zoomToNode", "focusNode", "hideSingletons"]),
    reset() {
      this.isFocused = false;
      this.hideSingletons();
    },
    focus() {
      this.isFocused = true;
      if (this.selectedNode) {
        this.focusNode(this.selectedNode);
      }
    },
    clickGenre(node) {
      this.selectedNodeName = node.label;
      this.selectedNode = node;
      this.zoomToNode(node);
    },
    doSearch(e) {
      this.selectedNode = null;
      const val = e.target.value;
      if (val.length > 2) {
        const regex = new RegExp(val, "i");
        const tempResults = [];
        for (
          let i = 0;
          i < this.nodes.length && tempResults.length < this.maxResults;
          i++
        ) {
          const node = this.nodes[i];
          if (regex.test(node.label)) {
            tempResults.push(node);
          }
        }
        this.results = tempResults;
      } else {
        this.results = [];
      }
    }
  }
};
</script>

<style scoped>
form {
  display: flex;
}
button {
  padding: 2px;
}
input {
  border-radius: 3px;
  padding: 2px;
  border: 1px solid #c0c0c0;
}
ul {
  max-height: 100px;
  overflow-y: auto;
  display: inline-block;
  list-style-type: none;
  padding: 0;
  background: #efefef;
}
li {
  text-align: left;
  cursor: pointer;
}
li:hover {
  color: white;
  background: #006666;
}
</style>
