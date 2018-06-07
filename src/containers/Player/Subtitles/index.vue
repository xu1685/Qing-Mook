<template>
  <div class="subtitles">
    <div class="textline" v-for="(item, index) in subtitles" :class="{onshow: index == activeSubtitleIndex }">
      <span class="start">{{formatDuring(item.beginTime)}}</span>
      <span class="wordstext">{{item.text}}</span>
    </div>
    <h3 style="color: gray;margin-top: 100px;" v-if="nowords">暂无字幕</h3>
  </div>
</template>

<script>

import MockData from './mock'
import Bus from '../../../bus.js'
import BScroll from 'better-scroll'

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
  },

  data() {
    return {
      text: '',
      textlines: [],
      startArr: [],
      timeArr: [],
      time: '',
      onshow: '',
      scroll: '',
      count: 0,
      nowords: false,
    }
  },

  created() {
    this.textlines = MockData.subtitles[0].textArr.split('。')
    this.startArr = MockData.subtitles[0].startTime
    for (let i = 0; i < this.startArr.length; i++) {
      this.timeArr.push(this.formatDuring(this.startArr[i]))
    }
  },

  updated() {
    this.onshow = document.querySelector('.onshow')
      if (this.onshow) {
        const nowH = this.onshow.offsetTop
        if (nowH > 100) {
          window.scrollTo(0, this.onshow.offsetTop - 100)
        }
    }
  },

  methods: {
    formatDuring(mss) {
      let minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60))
      let seconds = parseInt((mss % (1000 * 60)) / 1000)
      if (seconds < 10) {
        seconds += '0'
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

.textline {
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

.onshow {
  color: black;
  background-color: hsla(0, 0%, 50%, 0.1607843137254902);
  transition: background-color 0.1s;
}

</style>
