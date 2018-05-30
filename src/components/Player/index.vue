<template>
  <div class='playerWrapper'>
    <Header :pageName='documentName' />
    <Player
      :docId='docId'
      :message='selected'
    />
    <mt-navbar
      class='commentAndSubtitleToolBar'
      v-model='selected'
    >
      <mt-tab-item id='comment'>
        <span style='font-size: 16px;'>评论</span>
      </mt-tab-item>
      <mt-tab-item id='subtitles'>
        <span style='font-size: 16px;'>字幕</span>
      </mt-tab-item>
    </mt-navbar>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='subtitles'>
        <Words :docId='docId' />
      </mt-tab-container-item>
      <mt-tab-container-item id='comment'>
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
import Bus from '../../bus.js'

export default {
  name: 'PlayerPage',

  data() {
    return {
      documentName: '课程名称',
      selected: 'comment',
      docId: '',
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

    Bus.$on('COMPONENTS/PLAYER/PLAYER/DOCUMENT_NAME_CHANGE', (documentName) => {
      this.documentName = documentName
    })
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

.playerWrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.commentAndSubtitleToolBar {
  width: 100%;
}

.commentAndSubtitleToolBar > a:not(:first-child) {
  border-left: solid 1px #EEE;
}

</style>
