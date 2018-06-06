<template>
  <mt-header
    class="header"
    :title="title"
  >
    <a @click="back" slot="left">
      <mt-button icon="back" />
    </a>
  </mt-header>
</template>

<script>

export default {
  name: 'MyHeader',

  props: [
    'title',
  ],

  methods: {
    back() {
      this.$router.back()
    },
  },
}

</script>

<style scoped>

.header {
  background-color: #FFF;
  color: #000;
  font-size: 18px;
  width: 100%;
}

</style>
