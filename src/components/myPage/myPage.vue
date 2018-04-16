<template>
	<div class="myPage">
		<MyHeader :pageName="title" pagePath=""></MyHeader>
		<div class="container">
			<router-link to='/player'>
    	<span>课程页面入口</span>
    </router-link>
		</div>
    
	</div>
</template>

<script>
	import MyHeader from '../header/Header.vue'
	export default {
		name: 'MyPage',
		data(){
			return {
        title: "我的主页"
			}
		},
		components:{
			MyHeader
		}
	}
</script>

<style>
	.mypage{
		margin-top: 40px;
	}
	.container{
		margin-top: 40px;
	}
</style>