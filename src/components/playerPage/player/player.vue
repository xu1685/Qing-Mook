<template>
	<div id="playerContainer" >
		<div id="myplayer" ref="element" :class="{isfixed:!isnone}" @subtitlechange="handleTimechange" @load="loaded">

		</div>
		<div :class="{block:true, none: isnone}"  :style="{height: this.Height +'px'}" ></div>
	</div>
</template>

<script>
	import Player from './src/Player.js'
	import './src/Player.css'
  import Bus from '../../../bus.js';
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
		},
		methods:{
			pageInit(){
				this.$http.get('/docs/'+this.docId)
					.then((res) => {
						this.defaultAction = res.data.doc.defaultAction;
						this.action = res.data.doc.action;
						this.imageUrl = res.data.doc.pictures;
						for(var item in this.action){
							if(this.defaultAction == this.action[item].id){
								this.playAction = this.action[item];
								break;
							}
						}
						this.subtitle = this.playAction.subtitle;
						Bus.$emit('subtitle', this.subtitle);
					}).then(() => {
						var actionUrl = this.playAction.json;
						var audioUrl = this.playAction.recording;
						var imageUrl = this.imageUrl;
						var subtitles = this.subtitle;
						var mode = 'mobile';
						var duration = this.playAction.duration;

						var player = new Player({
						  actionUrl,
						  audioUrl,
						  imageUrl,
						  subtitles,
						  mode,
						  duration,
						  element: document.getElementById('myplayer')
						});
					}).catch(() => {
						alert('docId错误')
					})

			},
			handleTimechange(e){
				this.subtitleIndex = e.detail.subtitleIndex;
			},
			loaded(){
				var ele = document.querySelector('.player-image-container');
				this.Height = ele.offsetHeight;
				console.log(ele)
			}
		}
	}

</script>

<style>
#playerContainer{
		margin-top: 40px;
	width: 100%;
	background-color: #5d5d5d;
}
#myplayer{
	width: 100%;
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