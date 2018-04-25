<template>
	<div class="words">
		<div class="textline" v-for="(item,index) in subtitle" :class="{onshow: index == subtitleIndex }">
			<span class="start">{{formatDuring(item.beginTime)}}</span>
			<span class="wordstext">{{item.text}}</span>
  	</div>
	</div>
</template>

<script>
	import MockData from './mock'
	import Bus from '../../../bus.js';  
	import BScroll from 'better-scroll'

	export default{
		name:'Words',
		props:['docId'],
		data(){
			return{
        text:'',
        textlines:[],
        startArr:[],
        timeArr:[],
        time:'',
        onshow:'',
        scroll:'',
        count: 0,
        subtitle:[],
        subtitleIndex:-1
			}
		},
		created(){
				this.textlines = MockData.subtitles[0].textArr.split('。');
				this.startArr = MockData.subtitles[0].startTime;
	      this.pageInit();
	      for(var i=0;i<this.startArr.length;i++){
	        this.timeArr.push(this.formatDuring(this.startArr[i]))	
	      } 
		},
		updated(){
			// console.log('updated');
			this.onshow = document.querySelector('.onshow');
      	if(this.onshow){
			 		var nowH = this.onshow.offsetTop;
			    // console.log(nowH,this.onshow,'offsetTop');
				  if(nowH > 100){
				  	window.scrollTo(0,this.onshow.offsetTop -100)
				  }
				}
		},
		methods:{
			pageInit(){
				Bus.$on('subtitleIndex', subtitleIndex =>{
					this.changeActive(subtitleIndex)
				});
        Bus.$on('subtitle', subtitle =>{
					this.changeSubtitle(subtitle);
				});					
			},
			formatDuring(mss) {
			    var minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60));
			    var seconds = parseInt((mss % (1000 * 60)) / 1000);
			    if(seconds < 10){
			    	seconds = seconds + '0'
			    }
			    if(minutes < 10){
			    	minutes = '0' + minutes;
			    }
			    return  minutes + ":" + seconds ;
			},
			changeActive(index){
				this.subtitleIndex = index;
				// console.log(this.subtitleIndex,'change')
			},
      changeSubtitle(subtitle){
      	this.subtitle = subtitle;
      	// console.log(this.subtitle,'subtitle')
      }

		}
	}
</script>

<style scoped>
	.words{
		margin-top: 35px;
		position: relative;
	}
	.textline{
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
	.start{
		display: inline-block;
		width: 15%;
		height: 18px;
    margin-left: 1%;
    margin-right: 3%;
    font-size: 15px;
	}
	.wordstext{
		width: 70%;
		overflow: hidden;
		display: inline-block;
	}
	.onshow{
		color: black;
		background-color: hsla(0, 0%, 50%, 0.1607843137254902);
		transition: background-color 0.1s;
	}
</style>