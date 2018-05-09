<template>
	<div class="score">
		 <div class="overAll">
		 	<div class="left">
		 		<span style="margin-left: 10px;">综合评分</span>
		 		<span class="overAllScore">8.6</span>
		 	</div>
		 	<!-- <mt-cell style="color: #626262" title="综合评分">
		 	  <span class="overAllScore">8.6</span>
			</mt-cell> -->
		 </div>
		 <!-- 跳转到老师页面 -->
		 <div class="theTeacher">
		 	<router-link :to="'/teacher/' ">
		 		<div class="right">
			 		<img src="./logo.png" class="teacherPhoto">
			 		<span style="line-height: 15px;">{{teacherName}}</span>
			 		<span style="font-size: 13px;margin-left: 15px;line-height: 15px;">更多</span>
			 		<i class="fa fa-angle-right" aria-hidden="true" style="margin-left: 10px;color:gray"></i>
			 	</div>
		 	<!-- 	<mt-cell :title="teacherName" style="color: #494848" is-link>
				  <img slot="icon" src="./logo.png" class="teacherPhoto">
				  <span style="font-size: 13px;">更多</span>
				</mt-cell> -->
		 	</router-link>
		 	 
		 </div>
	</div>
</template>

<script>
	// import Star from './star.vue'
	export default {
		name: 'Score',
		props:['docId'],
		data(){
			return{
        done: false,
        teacherName: '蜗牛老师'
			}
		}
	}
</script>

<style>

a { text-decoration:none; } 
.mint-cell-wrapper{
	font-size: 14px !important;
}
.score{
	text-align: left;
	height: 50px;
	width: 90%;
	margin-top: 5px;
	margin-left: 5%;
	background-color: white;
	border-bottom: 1px solid lightgray;
	border-top: 1px solid lightgray;
	display: flex;
	align-items: center;
}
.overAll{
	display: inline-block;
	width: 43%;
	
}
.overAllScore{
	font-size: 24px;
	color:black;
}
.theTeacher{
	display: inline-block;
	width: 55%;
	line-height: 39px;
}
.right{
	display: flex;
	align-items: center;
	color: #494848;
	line-height: 39px;
}
  .teacherPhoto{
  	width: 30px;
  	height: 30px;
  	margin-right: 5px;
  }
</style>