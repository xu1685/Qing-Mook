<template>
	<div class="coursePage">
		<MyHeader :pageName="name"></MyHeader>
		<div class="container">
			  <div style="height: 200px;">
			  	<div class="message">
			    	<h2 class="coursetitle">{{this.library.name}}</h2>
			    	<span style="color: rgb(199, 199, 199)">共{{this.courseList.length}}个文档</span>
			    	<p style="margin-top: 20px;color: rgb(199, 199, 199)">{{this.createTime}}</p>
		      </div>
		    	<!-- 黑色透明遮罩 -->
			    <div class="black"></div>
			    <img :src="this.library.cover" onerror="this.style.display='none'" width="100%" height="200px;">
		      <!-- 内容：头像 信息 -->

		    <!-- 课程卡片 -->
		    </div>
			  
    		<div class="courseCell" @click="sendIndex" v-for="(course,index) in courseList" :key="index">
    			<router-link :to="{ path: '/player/'+ course.id  }"  class="link">
	    			<div class="imgcon">
	    				<img :src="course.cover" class="classImg">
	    			</div>
	    			<div style="color: black;width: 70%;text-align: left">
	    				<div style="display: inline-block;">
	    					<span class="className">{{course.name}}</span>
	    				</div>
	    				<div class="icons">
                <i class="fa fa-star" aria-hidden="true">{{score(course.ratingStatis)}}</i>
                 <!-- style="color:#ffb100;" -->

	    				  <i style="margin-left: 15px;" class="fa fa-eye" aria-hidden="true"></i><span style="display: inline-block;width: 18px;">{{course.view}}</span>

	    				  <i style="margin-left: 15px;" class="fa fa-commenting-o" aria-hidden="true"></i><span style="display: inline-block;width: 18px;">4</span>

	    				</div>
	    				
	    			</div>
		    		
	    		</router-link>
	    	</div>
      
		</div>
	</div>
</template>

<script>
	import MyHeader from '../header/Header.vue'
	import Bus from '../../bus.js'; 
  import { Indicator } from 'mint-ui';
	export default {
		name: 'course',
		data(){
			return {
        title: "课程列表",
        courseList:[],
        courseIndex: this.$route.params.id,
        docs:[],
        allDcos:[],
        library:{},
        cover:'',
        createTime:'',
        action:[],
        name:'课堂主页'
			}
		},
		// computed:{
  //     star:function(){
  //         return 
  //     }
  //   },
		created(){
      this.pageInite();
		},
		mounted(){

		},
		methods:{
			pageInite(){
        Indicator.open();
        this.$http.get('/accounts/docs')
					.then((res) => {
							// console.log(res.data);
						this.allDcos = res.data.docs;
						this.library = res.data.libraries[this.courseIndex];
						// this.name = this.library.name;
						this.createTime = this.library.createTime;
						this.createTime = this.createTime.replace('T',' ');
						this.createTime = this.createTime.replace(/\.\w+/,'')
						// console.log(this.createTime);
						// console.log(this.library,'library')
						this.docs = this.library.docs;
						var len = this.allDcos.length;
						for(var i = 0;i<len;i++){
							if(this.docs.indexOf(this.allDcos[i].id) != -1 && this.allDcos[i].status == 'open'){
                this.courseList.push(this.allDcos[i]);
							}
						}
						this.courseList = this.courseList.reverse();
				  	console.log(this.courseList,'courseList')
            Indicator.close();
				})
			},
			sendIndex(){
				Bus.$emit('index', this.index);
			},
			score(obj){
				var arr = Object.values(obj);
				var len = arr.length;
				var count = 0;
				for(var i=0;i<len;i++){
           count += arr[i];
				}
				if(count === 0){
          var score = "暂无评分";
				}else{
					var score = (arr[0]*1 + arr[1]*2 + arr[2]*3 + arr[3]*4 + arr[4]*5)/count;
					score = score.toFixed(1);
				}
				console.log(score,'score')
				return score
			}
		},
		components:{
			MyHeader
		}
	}
</script>

<style>
	.coursePage{
		margin-top: 40px;
	}
	 .black{
  	width: 100%;
  	height: 200px;
  	position: absolute;
  	background-color:rgba(0, 0, 0, 0.48);
    z-index: 1;
  }
   .message{
  	width: 100%;
  	height: 200px;
  	position: absolute;
  	top: 40px;
  	z-index: 3;
  }
  .coursetitle{
    margin-top: 40px;
    color: white;
    text-overflow: ellipsis;
    overflow:hidden;
    white-space: nowrap;
  }
	 .courseCell{
  	width: 100%;
  	background-color: rgba(212, 212, 212, 0.24);
  	height: 100px;
  	margin-top: 10px;
  	/*margin-left: 5%;*/
  	border-radius: 5px;
  }
  .link{
    display: flex;
    align-items: center;
    height: 100px;
  }
  .imgcon{
  	display: inline-block;
    width: 68px;
    height: 68px;
    overflow: hidden;
    margin: 10px;
    border: 1px solid gray;
  }
  .classImg{
  	height: 70px;
  	width: 70px;
  	display: inline-block;
  	float: left;
  	display: inline-block;
    background-position: 0px 1px;
    margin: -1px;
  }
 .className{
  	display: inline-block;
  	width: 180px;
    text-overflow: ellipsis;
    overflow:hidden;
    white-space: nowrap;
    font-size: 18px;
    margin-left: 15px;
  }
.icons{
	text-align:right;
	color: gray;
	/*margin-right: 20px;*/
	margin-top: 10px;
	width: 100%;
}

</style>