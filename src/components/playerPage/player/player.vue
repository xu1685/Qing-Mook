<template>
	<div id="playerContainer" >
		<div id="myplayer" :class="{isfixed: !isnone}" @subtitlechange="handleTimechange" @actionsLoaded="loaded" >

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
        isnone:true,
        screenWidth: document.body.clientWidth,
        screenHeight: window.innerHeight,
        hasEle:false,
        player:{}
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
      },
      screenWidth(){
      	setTimeout(() => {
      		var ele = document.querySelector('.player-image-container');
				this.Height = ele.offsetHeight;
				console.log(this.Height)
			},100)
      	
				// if(this.Height > this.screenHeight - 100){
				// 	this.isnone = true;
				// 	alert('hquxiao fix')
				// 	// Bus.$emit('barfix', false);
				// }else{
				// 	this.isnone = false;

				// 	// Bus.$emit('barfix', true);
				// }
      }
		},
		mounted(){
			this.pageInit();
			const that = this
      window.onresize = () => {
          return (() => {
              window.screenWidth = document.body.clientWidth
              that.screenWidth = window.screenWidth;
          })()
      }
		},
		beforeDestroy(){
			if(this.player && typeof this.player.unmount === 'function'){
				
        this.player.unmount();
			}
		},
		methods:{
			pageInit(){
				this.$http.get('/docs/'+this.docId)
					.then((res) => {
						console.log(res.data.doc,'doc')
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
						var actionUrl = this.playAction.json + (process.env.NODE_ENV === 'production' ? '' : '?platform=mobile');
						var audioUrl = this.playAction.recording;
						var imageUrl = this.imageUrl + (process.env.NODE_ENV === 'production' ? '' : '?platform=mobile');
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
						this.player = player;
            
					}).then(() =>{
							 this.hasEle = true;
						
					}).catch(() => {
						alert('获取数据错误，请检查访问地址是否正确')
					})

			},
			handleTimechange(e){
				this.subtitleIndex = e.detail.subtitleIndex;
			},
			loaded(){
				var ele = document.querySelector('.player-image-container');
				this.Height = ele.offsetHeight;
			},
			change(){
				console.log('change')
			},
			unmount(){

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