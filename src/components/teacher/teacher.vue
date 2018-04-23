
<template>
	<div class="teacher">
		<MyHeader :pageName="title" pagePath="player"></MyHeader>
    <div style="height: 200px;">
      <!-- 头像背景 -->
    	<div class="bg bg-blur"></div>
    	<!-- 黑色透明遮罩 -->
	    <div class="black"></div>
      <!-- 内容：头像 信息 -->
	    <div class="message">
	    	<mt-swipe class="mySwipe" :auto="0" :continuous="false">
				  <mt-swipe-item>
				  	<img src="./teacher.jpeg" class="photo">
			    	<h3 style="color:#FFFFFF">蜗牛老师</h3>
			    	<h5 style="color:#c7c7c7">web前端工程师</h5>
				  </mt-swipe-item>
				  <mt-swipe-item>
				  	<h4 style="color: rgb(232, 232, 232)">这是一段介绍</h4>
				  	<p style="color: rgb(232, 232, 232);padding-top: 15px;">
					  	《Sass与Compass实战》共分为10章，旨在完整介绍两个工具：Sass和Compass，从而引领读者通过框架高效地构建样式表，创建动态页面。
				    </p>
				  </mt-swipe-item>
				</mt-swipe>
				<div>
			</div>
    </div>
    <!-- 课程卡片 -->
    </div>
    <div class="course">
    	<div>
    		<span style="font-size: 18px;color: #3e3e3e;font-weight: 550;margin-top: 10px;display: block">主讲课程</span>
    	</div>
    	<router-link to="/player">
    		<div class="courseCell" v-for="(course,index) in courseList" :key="index">
    		<img src="./teacher.jpeg" class="classImg">
    		<span class="className">{{course.name}}</span>
    		<p class="classContent">{{course.content}}</p>
    	</div>
    	</router-link>
    	
    </div>
	</div>
</template>

<script>
	import MyHeader from '../header/Header.vue'
	import { Swipe, SwipeItem } from 'mint-ui';
	export default {
		name: 'Teacher',
		data(){
			return {
        title: this.$route.params.id,
        courseList:[
        {name:'课程名称',img:'./teacher.jpeg',content:'这里是课程介绍'},
        {name:'课程名称',img:'./teacher.jpeg',content:'这里是课程介绍'},
        {name:'课程名称',img:'./teacher.jpeg',content:'这里是课程介绍'},
        {name:'课程名称',img:'./teacher.jpeg',content:'这里是课程介绍'},
        {name:'课程名称',img:'./teacher.jpeg',content:'这里是课程介绍'}]
			}
		},
		created(){
			// console.log(this.$route.params.id);
      this.$http.get('/accounts/docs')
      .then(res=>{
        
        // console.log(res,'res')
      })
		},
		components:{
			MyHeader,
			'mt-swipe': Swipe,
			'mt-swipe-item': SwipeItem
		}
	}
</script>

<style>
	.teacher{
		margin-top: 40px;
	}
	.bg{
		width: 100%;
		height: 200px;
    background-image: url('./teacher.jpeg');
    background-color: #000000;
    background-repeat: no-repeat;
    background-position: center;
 
	}
	.bg-blur {
    float: left;
    width: 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    -webkit-filter: blur(10px);
    -moz-filter: blur(10px);
    -o-filter: blur(10px);
    -ms-filter: blur(10px);
    filter: blur(10px);
  }
  .black{
  	width: 100%;
  	height: 200px;
  	position: absolute;
  	background-color:rgba(0, 0, 0, 0.48);
  }
  .message{
  	width: 100%;
  	height: 200px;
  	position: absolute;
  }
  .photo{
  	width: 70px;
  	height: 70px;
  	border-radius: 50%;
  	border: 1px solid lightgray;
  	margin-top: 10px;
  }
  .mySwipe{
  	width: 100%;
  	height: 200px;
  }
  .course{
  	width: 100%;
  }
  .courseCell{
  	width: 90%;
  	background-color: rgba(212, 212, 212, 0.24);
  	height: 100px;
  	margin: 10px;
  	margin-left: 5%;
  	border-radius: 5px;
  	text-align: left;
  }
  .classImg{
  	height: 70px;
  	padding: 15px;
  	border-radius: 3px;
  	display: inline-block;
  	float: left;
  }
  .className{
  	display: inline-block;
  	position: relative;
  	margin-top: 20px;
  	color: black;
  }
  .classContent{
    color: gray;
    font-size: 15px;
  }

</style>