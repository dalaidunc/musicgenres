<template>
  <div class='sidebar'>
    <search></search>
    <button @click='hideSingletons' class='button'>Hide Singletons</button>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import search from './Search.vue';

export default {
  name: 'sidebar',
  methods: {
    ...mapActions(['hideSingletons'])
  },
  components: {
    search
  }
}
</script>

<style scoped>
.sidebar {
  position: absolute;
  right: 0;
  top: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #C0C0C0;
  border-right: 0;
  border-radius: 5px 0 0 5px;
  padding: 10px;
}
</style>
