<template>
  <svg id='chart'></svg>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'chart',
  computed: {
    ...mapGetters(['nodes', 'links'])
  },
  methods: {
    ...mapActions(['getData', 'hideSingletons', 'setupChart'])
  },
  mounted() { 
    this.setupChart('chart')
    this.getData().then(() => {
      this.hideSingletons();
    });
  }
}
</script>

<style>
#chart {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgb(225, 225, 210);
  margin: 0;
  padding: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.node {
  stroke: #fff;
  stroke-width: 2px;
}
.node circle {
  /* fill: rgba(0, 100, 150, 0.8); */
  stroke: #002299;
}
.node-label {
  fill: #2499FF;
  stroke: none;
}
.link {
  stroke: #999;
  stroke-width: 1px;
  stroke-opacity: 0.7;
}
.text-background {
  fill: rgba(200, 100, 150, 0.3);
  stroke: none;
}
</style>
