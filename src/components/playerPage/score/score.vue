<template>
	<div class="score">
		 <div class="overAll">
		 	<mt-cell style="color: #626262" title="综合评分">
		 	  <span class="overAllScore">8.6</span>
			</mt-cell>
		 </div>
		 <!-- 跳转到老师页面 -->
		 <div class="theTeacher">
		 	<router-link :to="'/teacher/' + teacherName">
		 		<mt-cell :title="teacherName" style="color: #494848" is-link>
				  <img slot="icon" src="./logo.png" class="teacherPhoto">
				  <span style="font-size: 13px;">更多</span>
				</mt-cell>
		 	</router-link>
		 	 
		 </div>
	</div>
</template>

<script>
	// import Star from './star.vue'
	export default {
		name: 'Score',
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
	margin-top: 35px;
	margin-left: 5%;
	background-color: white;
	border-bottom: 1px solid lightgray;
	border-top: 1px solid lightgray;
}
.overAll{
	display: inline-block;
	width: 40%;
	line-height: 39px;
}
.overAllScore{
	font-size: 24px;
	color:black;
}
.theTeacher{
	display: inline-block;
	width: 58%;
	line-height: 39px;
}
  .teacherPhoto{
  	width: 30px;
  	height: 30px;
  	margin-right: 5px;
  }
</style>