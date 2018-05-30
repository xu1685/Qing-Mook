<template>
  <div id="myPlayerContainer" >
    <div
      id="myPlayer"
      :class="{isfixed: !isnone}"
      @subtitlechange="handleTimechange"
      @actionsLoaded="loaded"
    />
    <div
      :class="{block: true, none: isnone}"
      :style="{height: this.Height +'px'}"
    />
  </div>
</template>

<script>
  import Player from './src/Player.js'
  import Bus from '../../../bus.js'

  import './src/Player.css'

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
        isnone: true,
        hasEle: false,
        player: {},
        library: '',
      }
    },

    watch: {
      subtitleIndex() {
        Bus.$emit('subtitleIndex', this.subtitleIndex)
      },

      message() {
        if (this.message === 'subtitles') {
          this.isnone = false
        } else {
          this.isnone = true
        }
      },
    },

    mounted() {
      this.pageInit()
    },

    beforeDestroy() {
      if(this.player && typeof this.player.unmount === 'function') {
        this.player.unmount()
      }
    },

    methods: {
      pageInit() {
        this
          .$http
          .get('/players/'+this.docId)
          .then((res) => {
            const action = res.data.doc.action
            const defaultAction = res.data.doc.defaultAction

            /* 获取到当前准备播放的文档时，触发文档名称改变事件，改变页面标题 */
            Bus.$emit('COMPONENTS/PLAYER/PLAYER/DOCUMENT_NAME_CHANGE', res.data.doc.name)

            this.imagesUrl = res.data.doc.pictures
            this.playAction = action.find((acs) => acs.id === defaultAction)
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
          }).catch((error) => {
            throw error
            alert('获取数据错误，请检查访问地址是否正确')
          })
      },

      handleTimechange(e) {
        this.subtitleIndex = e.detail.subtitleIndex
      },

      loaded() {
        var ele = document.querySelector('.player-image-container')
        this.Height = ele.offsetHeight
      },
    }
  }

</script>

<style>
  #myPlayerContainer {
    margin-top: 40px;
    width: 100%;
    background-color: #5d5d5d;
  }

  #myPlayer {
    width: 100%;
    background-color: white;
    position: relative;
  }

  .isfixed {
    position: fixed !important;
    z-index:1;
  }

  .block {
    background-color: white;
    z-index: 1;
  }

  .none {
    display: none;
  }
</style>