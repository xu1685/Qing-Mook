<template>
	<div class="subtitles">
		<div class="textline" v-for="(item, index) in subtitle" :class="{onshow: index == subtitleIndex }">
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

  props: ['docId'],

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
      subtitle: [],
      nowords: false,
      subtitleIndex: -1,
    }
  },

  created() {
    this.textlines = MockData.subtitles[0].textArr.split('。')
    this.startArr = MockData.subtitles[0].startTime
    this.pageInit()
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
    pageInit() {
      Bus.$on('subtitleIndex', (subtitleIndex) => {
        this.changeActive(subtitleIndex)
      })
      Bus.$on('subtitle', (subtitle) => {
        this.changeSubtitle(subtitle)
      })
    },

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

    changeActive(index) {
      this.subtitleIndex = index
    },

    changeSubtitle(subtitle) {
    	this.subtitle = subtitle
    	if (this.subtitle.length == 0) {
    		this.nowords = true
    	} else {
    		this.nowords = false
    	}
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
