<template>
	<div class="score">
		 <div class="overAll">
		 	<div class="left">
		 		<span style="margin-right: 15px;">评分:</span>
		 		<span :class="{scorenum:true,noscore: scorenum == '暂无评分'}">{{scorenum}}</span>
		 		<span class="overAllScore"></span>
		 	</div>
		 </div>
		 <!-- 跳转到老师页面 -->
		 <div class="theTeacher">
		 	<router-link :to="'/teacher/' ">
		 		<div class="right">
			 		<img src="./logo.png" class="teacherPhoto">
			 		<span style="line-height: 15px;">{{teacherName}}</span>
			 		<i class="fa fa-angle-right" aria-hidden="true" style="margin-left: 10px;color:gray"></i>
			 	</div>
		 	</router-link>

		 </div>
	</div>
</template>

<script>
	// import Star from './star.vue'
	export default {
		name: 'Score',
		props: ['docId'],
		data() {
			return {
        done: false,
        teacherName: '蜗牛老师',
        doc:{},
        ratingStatis:[],
        scorenum:0
			}
		},
		created() {
			this.pageInit()
		},
		methods: {
			pageInit() {
				this
					.$http
					.get('/docs/'+this.docId)
					.then((res) => {
						this.doc = res.data.doc;
						this.ratingStatis = this.doc.ratingStatis;
						this.scorenum = this.score(this.ratingStatis);
					})
			},
			score(obj) {
				var arr = Object.values(obj);
				var len = arr.length;
				var count = 0;
				for (var i = 0; i < len; i++) {
           count += arr[i];
				}
				if (count === 0) {
          var score = "暂无评分";
				} else {
					var score = (arr[0]*1 + arr[1]*2 + arr[2]*3 + arr[3]*4 + arr[4]*5)/count;
					score = score.toFixed(1);
				}
				return score
			}
		}
	}
</script>

<style>

a {
	text-decoration:none;
}

.mint-cell-wrapper {
	font-size: 14px !important;
}

.score {
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

.overAll {
	display: inline-block;
	width: 43%;
}

.overAllScore {
	font-size: 24px;
	color:black;
}

.scorenum {
	font-size: 25px;font-weight: 600;color: rgb(71, 71, 71)
}

.noscore {
	font-size: 16px;
}

.theTeacher {
	display: inline-block;
	width: 55%;
	line-height: 39px;
}

.right {
	display: flex;
	align-items: center;
	color: #494848;
	line-height: 39px;
	float: right;
}

.teacherPhoto {
	width: 30px;
	height: 30px;
	margin-right: 5px;
}
</style>