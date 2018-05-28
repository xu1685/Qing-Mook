
<template>
  <div>
    <mt-header fixed class="header" :title="pageName">
      <a @click="back" slot="left">
        <mt-button icon="back" v-if="pagePath !== '00' "></mt-button>
        <router-link id="p" :to="{ path: '/course/' + courseIndex}"></router-link>
        <router-link id="c" :to="{ path: '/teacher/'}"></router-link>
      </a>
    </mt-header>
  </div>
</template>

<script>
export default {
  name:'MyHeader',
  props:['pageName','pagePath'],
  data(){
    return{
      courseIndex:0,
      libraries:[],
      path:'',
      library:''
    }
  },
  created(){
    this.path = this.pagePath;
    if(this.path.slice(0,1) == 'p'){
        this.docId = this.path.slice(1);
        this.$http.get('/docs/'+this.docId).then((res)=>{
          this.library = res.data.doc.library;
        }).then(()=>{
          this.$http.get('/accounts/docs')
            .then((res) => {
              this.libraries = res.data.libraries;
              var len = this.libraries.length;
              for(var i=0;i<len;i++){
                if(this.library == this.libraries[i].id){
                  this.courseIndex = i;
                  break;
                }
              }
           });
        })

    }
  },
  methods:{
    back(){
      if(this.path.slice(0,1) == 'p'){
        document.getElementById("p").click();
      }else if(this.path.slice(0,1) == 'c'){
        document.getElementById("c").click();
      }

    }
  }
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
#p{
  width: 0px;
}
</style>
