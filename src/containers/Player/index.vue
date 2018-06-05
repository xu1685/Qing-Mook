<template>
  <div class='container'>
    <div
      id='fixedComponentWrapper'
      :style='selected === "subtitles" ? {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "100",
      } : undefined'
    >
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
    </div>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='subtitles'>
        <Subtitles
          :name=''
          :accountId=''
          :score=''
          :style='{marginTop: selected === "subtitles" ? fixedComponentWrapperElementHeight + "px" : undefined}'
        />
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
import Subtitles from './Subtitles'
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

  beforeCreate() {
    if (this.$route.params.id === undefined) {
      alert('id错误')
    } else {
      this.docId = this.$route.params.id

      this
        .$http
        .get(`/players/${this.docId}`)
        .then((res) => {
          const action = res.data.doc.action
          const defaultAction = res.data.doc.defaultAction

          /* 获取到当前准备播放的文档时，触发文档名称改变事件，改变页面标题 */
          Bus.$emit('COMPONENTS/PLAYER/PLAYER/DOCUMENT_NAME_CHANGE', res.data.doc.name)

          this.imagesUrl = res.data.doc.pictures
          this.playAction = action.find(acs => acs.id === defaultAction)
          this.subtitle = this.playAction.subtitle
          Bus.$emit('subtitle', this.subtitle)
        }).then(() => {
          this.player = new Player({
            actionUrl: this.playAction.json,
            audioUrl: this.playAction.recording,
            duration: this.playAction.duration,
            element: document.getElementById('myPlayer'),
            imageUrls: this.imagesUrl,
            mode: 'mobile',
            size: this.playAction.totalSize,
            subtitles: this.subtitle,
          })
        }).then(() => {
          this.hasEle = true
        })
        .catch((error) => {
          throw error
          alert('获取数据错误，请检查访问地址是否正确')
        })

    }

    Bus.$on('COMPONENTS/PLAYER/PLAYER/DOCUMENT_NAME_CHANGE', (documentName) => {
      this.documentName = documentName
    })
  },

  computed: {
    fixedComponentWrapperElementHeight() {
      if (this.selected === 'subtitles') {
        return document.getElementById('fixedComponentWrapper').clientHeight
      }
    },
  },

  components: {
    Header,
    Player,
    Comment,
    Score,
    Subtitles,
  },
}

</script>

<style scoped>

.container {
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
