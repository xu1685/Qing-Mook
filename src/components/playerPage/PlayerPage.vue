<template>
  <div class="play">
    <MyHeader :pageName="course" pagePath=""></MyHeader>
    <Player :message="selected" :docId="docId"></Player>
    <mt-navbar v-model="selected" class="bar">
      <mt-tab-item id="commentBar"><span style="font-size: 16px;">评论</span></mt-tab-item>
      <mt-tab-item id="wordsBar"><span style="font-size: 16px;">字幕</span></mt-tab-item>
    </mt-navbar>
    <mt-tab-container v-model="selected">
      <mt-tab-container-item id="commentBar">
        <Score></Score>
        <Comment :docId="docId"></Comment>
      </mt-tab-container-item>
      <mt-tab-container-item id="wordsBar">
        <Words :docId="docId"></Words>
      </mt-tab-container-item>
    </mt-tab-container>
  </div>
</template>

<script>
import MyHeader from '../header/Header.vue'
import Comment from './comment/comment.vue'
import Player from './player/player.vue'
import Score from './score/score.vue'
import Words from './words/words.vue'
import Bus from '../../bus.js'; 
import { Navbar, TabItem } from 'mint-ui';
export default {
  name: 'PlayerPage',
  data () {
    return {
     course: '课程名称',
     selected:'commentBar',
     docId: '0000'
    }
  },
  created(){
    if(this.$route.params.id == undefined){
      alert('id错误')
    }
    console.log(this.$route.params.id,'created');
    this.docId = this.$route.params.id;
  },
  methods:{
  
  },
  // watch:{
  //   selected(){
  //     console.log(this.selected);
  //     if(this.selected == 'wordsBar'){

  //     }
  //   }
  // },
  components: {
      MyHeader,
      Player,
      Comment,
      Score,
      Words,
      'mt-navbar':Navbar,
      'mt-tab-item':TabItem
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.play{
  width: 100%;
}
.bar{
 /* position: fixed;*/
  width: 100%;
  background-color: white;
  z-index: 1;
}
.mint-navbar .mint-tab-item{
  padding: 7px !important
}
</style>
