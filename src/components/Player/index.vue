<template>
  <div class="play">
    <MyHeader
      :pageName='course'
      :pagePath=' "p" + docId'
    />
    <Player
      :docId='docId'
      :message='selected'
      @myname='myname'
    />
    <mt-navbar
      class='bar'
      v-model='selected'
      :class='{isfixed: selected === "wordsBar" && barfix}'
    />
      <mt-tab-item id='commentBar'>
        <span style='font-size: 16px;'>评论</span>
      </mt-tab-item>
      <mt-tab-item id='wordsBar'>
        <span style='font-size: 16px;'>字幕</span>
      </mt-tab-item>
    </mt-navbar>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='commentBar'>
        <Score :docId='docId' />
        <Comment :docId='docId' />
      </mt-tab-container-item>
      <mt-tab-container-item id='wordsBar'>
        <Words :docId='docId' />
      </mt-tab-container-item>
    </mt-tab-container>
  </div>
</template>

<script>

import { Navbar, TabItem } from 'mint-ui'
import MyHeader from '../Header'
import Comment from './comment/comment.vue'
import Player from './player/player.vue'
import Score from './score/score.vue'
import Words from './words/words.vue'

export default {
  name: 'PlayerPage',

  data() {
    return {
      course: '课程名称',
      selected: 'commentBar',
      docId: '0000',
      barfix: true,
      path: '',
      params: '',
    }
  },

  created() {
    if (this.$route.params.id === undefined) {
      alert('id错误')
    }
    this.docId = this.$route.params.id
  },

  methods: {
    myname(data) {
      this.course = data
    },
  },

  components: {
    MyHeader,
    Player,
    Comment,
    Score,
    Words,
    'mt-navbar': Navbar,
    'mt-tab-item': TabItem,
  },
}

</script>

<style scoped>

.play{
  width: 100%;
}

.bar{
  margin-top: -1px;
  width: 100%;
  background-color: white;
  z-index: 1;
}

.isfixed{
  position: fixed !important;
}

</style>
