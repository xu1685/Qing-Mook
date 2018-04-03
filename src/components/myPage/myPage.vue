<template>
	<div class="myPage">
		<MyHeader :pageName="title" pagePath=""></MyHeader>

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
</style>