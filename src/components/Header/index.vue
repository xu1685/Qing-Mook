<template>
  <mt-header fixed class="header" :title="pageName">
    <a @click="back" slot="left">
      <mt-button icon="back" />
    </a>
  </mt-header>
</template>

<script>

export default {
  name: 'MyHeader',

  props: [
    'pageName',
    'pagePath',
  ],

  data() {
    return {

    }
  },

  created() {

  },

  methods: {
    back() {
      this.$router.back()
    }
  }
}

</script>

<style scoped>

.header {
  background-color: #F8F8F8;
  color: #000;
  font-size: 18px;
  height: 40px;
  z-index: 100;
}

</style>
