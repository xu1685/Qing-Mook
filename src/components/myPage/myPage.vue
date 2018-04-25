<template>
	<div class="myPage">
		<MyHeader :pageName="title" pagePath=""></MyHeader>
		<div class="container">
			<router-link :to="{ path: '/player/'+docId }" >
    	<span>课程页面入口</span>
    </router-link>
		</div>
    
	</div>
</template>

<script>
	import MyHeader from '../header/Header.vue'
	import Bus from '../../bus.js'; 
	export default {
		name: 'MyPage',
		data(){
			return {
        title: "我的主页",
        docId:'5acf24ca897a186f4028d9e7'
			}
		},
		methods:{
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