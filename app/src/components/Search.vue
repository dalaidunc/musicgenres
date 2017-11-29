<template>
  <div>
    <form>
      <input @input='doSearch' type='text' name='search' />
      <button type='submit'>Search</button>
    </form>
    <ul v-if='results.length'>
      <li @click="clickGenre(result)" :key="result.uri" v-for='result in results'>{{result.label}}</li>
    </ul>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'search',
  data() {
    return {
      results: [],
      maxResults: Infinity
    };
  },
  computed: {
    ...mapGetters(['nodes'])
  },
  methods: {
    ...mapActions(['zoomToNode']),
    clickGenre (node) {
      console.log(node);
      this.zoomToNode(node);
    },
    doSearch (e) {
      const val = e.target.value;
      if (val.length > 2) {
        const regex = new RegExp(val, 'i');
        const tempResults = [];
        for (let i = 0; i < this.nodes.length && tempResults.length < this.maxResults; i++) {
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
}
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
  border: 1px solid #C0C0C0;
}
ul {
  max-height: 100px;
  overflow-y: auto;
  display: inline-block;
  list-style-type: none;
  padding: 0;
  background: #EFEFEF;
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
