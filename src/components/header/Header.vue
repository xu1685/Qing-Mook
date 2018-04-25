
<template>
  <div>
    <mt-header fixed class="header" :title="pageName">
      <router-link :to="'/' + pagePath" slot="left">
        <mt-button icon="back"></mt-button>
      </router-link>
      
    </mt-header>
  </div>
</template>

<script>
export default {
  name:'MyHeader',
  props:['pageName','pagePath']
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

.header{
  background-color: #f8f8f8;
  margin: 0;
  color: gray;
  font-size: 18px;
  height: 40px;
  z-index: 120 !important;
}
.smallImg{
  margin-top: 20px;
  width: 28px;
  height: 28px;
}
</style>
