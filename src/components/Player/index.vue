<template>
  <div class="play">
    <Header
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
      :class='{isfixed: selected === "subtitles" && barfix}'
    >
      <mt-tab-item id='subtitles'>
        <span style='font-size: 16px;'>字幕</span>
      </mt-tab-item>
      <mt-tab-item id='commentBar'>
        <span style='font-size: 16px;'>评论</span>
      </mt-tab-item>
    </mt-navbar>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='subtitles'>
        <Words :docId='docId' />
      </mt-tab-container-item>
      <mt-tab-container-item id='commentBar'>
        <Score :docId='docId' />
        <Comment :docId='docId' />
      </mt-tab-container-item>
    </mt-tab-container>
  </div>
</template>

<script>

import Header from '../Header'
import Comment from './Comment'
import Player from './Player'
import Score from './Score'
import Words from './Words'

export default {
  name: 'PlayerPage',

  data() {
    return {
      course: '课程名称',
      selected: 'subtitles',
      docId: '',
      barfix: true,
      path: '',
      params: '',
    }
  },

  created() {
    if (this.$route.params.id === undefined) {
      alert('id错误')
    } else {
      this.docId = this.$route.params.id
    }
  },

  methods: {
    myname(data) {
      this.course = data
    },
  },

  components: {
    Header,
    Player,
    Comment,
    Score,
    Words,
  },
}

</script>

<style scoped>

.play {
  width: 100%;
}

.bar {
  margin-top: -1px;
  width: 100%;
  background-color: white;
  z-index: 1;
}

.isfixed {
  position: fixed !important;
}

</style>
