<template>
	<div id="playerContainer"  ref="element">
		<div id="myplayer" :class="{isfixed:!isnone}" @timechange="handleTimechange">
			
		</div>
		<div :class="{block:true, none: isnone}"  :style="{height: this.Height +'px'}" ></div>
	</div>
</template>

<script>
	import Player from './src/Player.js'
	import './src/Player.css'
  import Bus from '../bus.js'; 
	export default{
		name:'Player',
		props:['message'],
		data(){
      return{
        Height:0,
        currentTime: '',
        isnone:true
      }
		},
		watch:{
			currentTime(){
				Bus.$emit('startTime', this.currentTime);     
			},
      message(){
        
        if(this.message == 'wordsBar'){
          this.isnone = false
        }else{
        	this.isnone = true
        }
      }
		},
		mounted(){
			this.pageInit();
			this.Width = this.$refs.element.offsetWidth;
			this.Height = this.Width * 0.75 + 40;
      console.log(this.Height,'mounted');
		},
		methods:{
			pageInit(){
				const actionUrl = 'http://120.78.175.118:1000/jsons/d55c581a15606633d494c2b311916068.json';
				const audioUrl = 'http://120.78.175.118:1000/recordings/cf5e6d87ea235d3dab8d719c5b52795d.mp3';
				const imageUrl = 'http://120.78.175.118:1000/pictures/df7324f9134131ad5ec17825ee3c3c83.zip'; 

				var player = new Player({
				  actionUrl,
				  audioUrl,
				  imageUrl,
				  element: document.getElementById('myplayer')
				})
        // document.getElementById('myplayer').addEventListener("timechange",this.handleTimechange);
			},
			handleTimechange(e){
				
				this.currentTime = Math.floor(e.detail.time);
        // console.log(this.currentTime,'time')
			}
		}
	}
	
</script>

<style>
#playerContainer{
	width: 100%;
	background-color: #5d5d5d;
}
#myplayer{
	width: 100%; 
	/*position: fixed !important;*/
	margin-top: 40px;
  background-color: white;
 /* z-index:1;*/
}
.isfixed{
	position: fixed !important;
	z-index:1;
}
.block{
  background-color: white;
  z-index: 1;
}
.none{
	display: none;
}
</style>