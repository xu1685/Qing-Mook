<template>
	<div class="words">
		<div class="textline" v-for="(item,index) in textlines" :class="{onshow: startArr[index] < time && time <startArr[index+1]}">
			<span class="start">{{timeArr[index]}}</span>
			<span class="wordstext">{{item}}</span>
  	</div>
	</div>
</template>

<script>
	import MockData from './mock'
	import Bus from '../bus.js';  
	import BScroll from 'better-scroll'

	export default{
		name:'Words',
		data(){
			return{
        text:'',
        textlines:[],
        startArr:[],
        timeArr:[],
        time:'',
        onshow:'',
        scroll:'',
        count: 0
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
		mounted(){
        this.$nextTick(() => {
        	let words = document.querySelector('.words')
          this.scroll = new BScroll(words);
        })
         
		},
		methods:{
			pageInit(){
				Bus.$on('startTime', time =>{
					this.changeActive(time)
					// console.log(time,'words');
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
			changeActive(time){
				 this.time = time;
				 if(this.startArr[this.count] < time && time < this.startArr[this.count+1]){
					 	this.count = this.count + 1;
					 	this.onshow = document.querySelector('.onshow');
					 	if(this.onshow){
					 		var nowH = this.onshow.offsetTop
					    console.log(nowH,'show');
						  if(nowH > 100){
						  	window.scrollTo(0,this.onshow.offsetTop - 100)
						  }
					 	}
				 }else if(time < this.startArr[this.count-1]){
				  	console.log('time<star')
				 	  for(var i=this.count; i>0; i--){
				 	  	console.log(i)
              if(this.startArr[i] < time){
              	this.count = i;
              	break;
              }
				 	  }
				 }else if(time > this.startArr[this.count] ){
				 	 console.log('time>star')
				 	 var len = this.startArr.length;
				 	  for(var i=this.count; i<len; i++){
				 	  	console.log(i)
              if(this.startArr[i+1] > time){
              	this.count = i;
              	break;
              }
				 	  }
				 }
			},


		}
	}
</script>

<style scoped>
	.words{
		margin-top: 35px;
		
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
		background-color: #80808029;
		transition: background-color 0.1s;
	}
</style>