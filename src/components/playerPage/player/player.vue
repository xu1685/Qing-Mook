<template>
	<div id="playerContainer"  ref="element">
		<div id="myplayer" :class="{isfixed:!isnone}" @subtitlechange="handleTimechange">
			
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
		props:['message','docId'],
		data(){
      return{
        Height:0,
        subtitleIndex: '',
        isnone:true
      }
		},
		watch:{
			subtitleIndex(){
				Bus.$emit('subtitleIndex', this.subtitleIndex);     
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
      // console.log(this.Height,'mounted');
		},
		methods:{
			pageInit(){
				this.$http.get('/docs/'+this.docId)
					.then(res=>{
						this.defaultAction = res.data.doc.defaultAction;
						this.action = res.data.doc.action;
						this.imageUrl = res.data.doc.pictures;
						this.defaultAction = "5ad0acc9052ee15191c73022"; //记得删除
						console.log(this.action)
						for(var item in this.action){
							if(this.defaultAction == this.action[item].id){
								this.playAction = this.action[item];
								break;
							}
						}
						this.subtitle = this.playAction.subtitle;
						Bus.$emit('subtitle', this.subtitle);
					}).then(() => {
						var actionUrl = 'http://120.78.175.118:1000/jsons/d55c581a15606633d494c2b311916068.json';
						// this.playAction.json;
						var audioUrl = 'http://120.78.175.118:1000/recordings/cf5e6d87ea235d3dab8d719c5b52795d.mp3';
						// this.playAction.recording;
						var imageUrl = 'http://120.78.175.118:1000/pictures/df7324f9134131ad5ec17825ee3c3c83.zip';
						var subtitles = this.subtitle;
						// this.imageUrl;
						var player = new Player({
						  actionUrl,
						  audioUrl,
						  imageUrl,
						  subtitles,
						  element: document.getElementById('myplayer')
						});
						console.log(player,'player')
					})


				// const actionUrl = 'http://120.78.175.118:1000/jsons/d55c581a15606633d494c2b311916068.json';
				// const audioUrl = 'http://120.78.175.118:1000/recordings/cf5e6d87ea235d3dab8d719c5b52795d.mp3';
				// const imageUrl = 'http://120.78.175.118:1000/pictures/df7324f9134131ad5ec17825ee3c3c83.zip'; 

			},
			handleTimechange(e){
				this.subtitleIndex = e.detail.subtitleIndex;
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