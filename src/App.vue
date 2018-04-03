<template>
  <div id="app">
    <!-- div -->

    <!-- <div></div> -->
   
    <router-view/>
  </div>
</template>

<script>

export default {
  name: 'App',
  data(){
    return{

    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 100%;
}
.mint-cell{
  z-index: 0 !important;
}
a{ text-decoration:none; }
</style>
