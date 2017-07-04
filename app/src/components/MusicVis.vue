<template>
  <div>
    <chart></chart>
    <sidebar></sidebar>
  </div>
</template>

<script>
import chart from './Chart.vue';
import sidebar from './Sidebar.vue';

export default {
  name: 'musicvis',
  components: {
    chart,
    sidebar
  }
}
</script>

<style scoped>

</style>
