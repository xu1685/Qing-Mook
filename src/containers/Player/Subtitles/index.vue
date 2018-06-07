<template>
  <div
    class='subtitles'
    ref='subtitlesContainer'
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
    <h3 style='color: gray; margin-top: 100px;' v-if='!subtitles.length'>暂无字幕</h3>
  </div>
</template>

<script>

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
      text: '',
      time: '',
      scroll: '',
      count: 0,
    }
  },

  updated() {
    if (this.$refs.activeSubtitle[0]) {
      const offsetTop = this.$refs.activeSubtitle[0].offsetTop
      document.documentElement.scrollTop = offsetTop
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
