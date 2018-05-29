<template>
  <div id="myPlayerContainer" >
    <div id="myplayer" :class="{isfixed: !isnone}" @subtitlechange="handleTimechange" @actionsLoaded="loaded" >

    </div>
    <div :class="{block:true, none: isnone}"  :style="{height: this.Height +'px'}" ></div>
  </div>
</template>

<script>
  import Player from './src/Player.js'
  import Bus from '../../../bus.js';

  import './src/Player.css'

  export default{
    name: 'Player',
    props: ['message','docId'],
    data() {
      return {
        Height: 0,
        subtitleIndex: '',
        isnone: true,
        screenWidth: document.body.clientWidth,
        screenHeight: window.innerHeight,
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
        if (this.message == 'wordsBar') {
          this.isnone = false
        } else {
          this.isnone = true
        }
      },

      screenWidth() {
        setTimeout(() => {
          var ele = document.querySelector('.player-image-container')
          this.Height = ele.offsetHeight
        },100)

        // if(this.Height > this.screenHeight - 100){
        //  this.isnone = true;
        //  alert('hquxiao fix')
        //  // Bus.$emit('barfix', false);
        // }else{
        //  this.isnone = false;

        //  // Bus.$emit('barfix', true);
        // }
      }
    },

    mounted() {
      this.pageInit()
      const that = this
      window.onresize = () => {
          return (() => {
              window.screenWidth = document.body.clientWidth
              that.screenWidth = window.screenWidth
          })()
      }
    },

    beforeDestroy(){
      if(this.player && typeof this.player.unmount === 'function'){
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
            this.$emit('myname',res.data.doc.name)
            this.imagesUrl = res.data.doc.pictures
            this.playAction = action.find((acs) => acs.id === defaultAction)
            this.subtitle = this.playAction.subtitle
            Bus.$emit('subtitle', this.subtitle)
          }).then(() => {
            this.player = new Player({
              actionUrl: this.playAction.json,
              audioUrl: this.playAction.recording,
              duration: this.playAction.duration,
              element: document.getElementById('myplayer'),
              imageUrls: this.imagesUrl,
              mode: 'mobile',
              size: this.playAction.totalSize,
              subtitles: this.subtitle,
            })
          }).then(() =>{
            this.hasEle = true
          }).catch((error) => {
            throw error
            alert('获取数据错误，请检查访问地址是否正确')
          })
      },

      handleTimechange(e){
        this.subtitleIndex = e.detail.subtitleIndex
      },

      loaded(){
        var ele = document.querySelector('.player-image-container')
        this.Height = ele.offsetHeight
      },

      change(){
        console.log('change')
      },

      unmount(){

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

  #myplayer {
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