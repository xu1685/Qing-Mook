<template>
  <div
    class='subtitles'
    :style='subtitleContainerMarginTop ? { marginTop: `${subtitleContainerMarginTop}px` } : undefined'
  >
    <div
      class='subtitle'
      v-for='(subtitle, index) in subtitles'
      :class='{activeSubtitle: index === activeSubtitleIndex }'
      :key='subtitle.beginTime'
      :ref='index === activeSubtitleIndex ? "activeSubtitle" : undefined'
    >
      <span class='start'>{{formatDuring(subtitle.beginTime)}}</span>
      <span class='wordstext'>{{subtitle.text}}</span>
    </div>
    <h3
      style='color: gray; margin-top: 100px;'
      v-if='!subtitles.length'
    >
      暂无字幕
    </h3>
  </div>
</template>

<script>

const browser = require('../../../utils/browser')

export default {
  name: 'Subtitles',

  props: {
    activeSubtitleIndex: {
      type: Number,
      required: true,
    },
    subtitles: {
      type: Array,
      required: true,
    },
    subtitleContainerMarginTop: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      browser: {},
      count: 0,
      scroll: '',
      text: '',
      time: '',
    }
  },

  mounted() {
    this.browser = new browser.Browser(window.navigator.userAgent)
  },

  updated() {
    if (this.$refs.activeSubtitle && this.$refs.activeSubtitle[0]) {
      const offsetTop = this.$refs.activeSubtitle[0].offsetTop
      const clientHeight = this.$refs.activeSubtitle[0].clientHeight
      if (this.browser.os === 'iOS') {
        document.body.scrollTop = offsetTop - (window.innerHeight - this.subtitleContainerMarginTop - clientHeight) / 2
      } else {
        document.documentElement.scrollTop = offsetTop - (window.innerHeight - this.subtitleContainerMarginTop - clientHeight) / 2
      }
    }
  },

  methods: {
    formatDuring(mss) {
      let minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60))
      let seconds = parseInt((mss % (1000 * 60)) / 1000)
      if (seconds < 10) {
        seconds = `0${seconds}`
      }
      if (minutes < 10) {
        minutes = `0${minutes}`
      }
      return `${minutes}:${seconds}`
    },
  },
}

</script>

<style scoped>

.subtitles {
  position: relative;
  border-top: solid 1px #EEE
}

.subtitle {
  text-align: left;
  font-size: 16px;
  padding-top: 5px;
  padding-bottom: 5px;
  color:gray;
  display: flex;
  align-items:center;
  padding: 6px;
  border-bottom: 1px solid lightgray;
}

.start {
  display: inline-block;
  width: 15%;
  height: 18px;
  margin-left: 1%;
  margin-right: 3%;
  font-size: 15px;
}

.wordstext {
  width: 70%;
  overflow: hidden;
  display: inline-block;
}

.activeSubtitle {
  color: black;
  background-color: #DDD;
  transition: background-color 0.1s;
}

</style>
