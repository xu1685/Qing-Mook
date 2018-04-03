
<template>
  <div>
    <!-- <mt-cell class="header" :title="pageName" is-link>
        <img slot="icon" src="../../assets/logo.png" width="24" height="24" />
    </mt-cell> -->
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
  z-index: 10;
}
.smallImg{
  margin-top: 20px;
  width: 28px;
  height: 28px;
}
</style>
