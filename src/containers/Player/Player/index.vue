<template>
  <div
    id="player"
    @subtitlechange="handleTimechange"
    @actionsLoaded="loaded"
  />
</template>

<script>

import './src/Player.css'

import Player from './src/Player.js'
import Bus from '../../../bus.js'

export default {
  name: 'Player',

  props: [
    'docId',
    'message',
  ],

  data() {
    return {
      Height: 0,
      subtitleIndex: '',
      hasEle: false,
      player: {},
      library: '',
    }
  },

  watch: {
    subtitleIndex() {
      Bus.$emit('subtitleIndex', this.subtitleIndex)
    },
  },


  mounted() {
    this.pageInit()
  },

  beforeDestroy() {
    if (this.player && typeof this.player.unmount === 'function') {
      this.player.unmount()
    }
  },

  methods: {
    pageInit() {
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
    },

    handleTimechange(e) {
      this.subtitleIndex = e.detail.subtitleIndex
    },

    loaded() {
      const ele = document.querySelector('.player-image-container')
      this.Height = ele.offsetHeight
    },
  },
}

</script>

<style>

#myPlayer {
  width: 100%;
  position: relative;
}

</style>
