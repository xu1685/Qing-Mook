<template>
	<div class="commentContainer">
		
		<!-- 评论输入框 -->
		 <mt-field class="commentInput" placeholder="评论" v-model="myComment">
				<i @click="visible=true" 
					v-if="iconIs === 1" 
					class="fa fa-picture-o" 
					aria-hidden="true"
					style="font-size: 26px;"></i>
				<img :src="this.preview0" v-if="iconIs === 2" width="35px">
				<mt-button @click="comment()" height="45px" style="margin-left: 10px;margin-right: -5px;"  type="default">提交</mt-button>
		 </mt-field>
    <!-- 评论容器 -->
			<div class="commentCell" 
			 v-for="(item,index) in commentList"
			 :key="index"><!-- key为该评论数组序列号 -->
	      <!-- 用户头像名称 -->
				<img src="./logo.png" class="userPhoto" :id="'photo' + index">
				<span class="name">{{item.accountId}}</span>

				<!-- 回复 点赞等 -->
				<div class="replyBtnCell">
					<!-- 点赞 -->
					<i @click="approveHandle(index,0,1)" :id="'approve' + item.id" class="fa fa-thumbs-o-up" aria-hidden="true" style="font-size: 20px;"></i>
					<span>{{item.approve.length}}</span>
        
			</div>

      <!-- 评论内容 -->
			<p class="text">{{item.text}}</p>
      <div class="imgBox">
				<img @click="showImg(img)" v-for="(img,index) in item.images" class="textImg" :src="img" width="60px" height="60px">
		  </div>
			<!-- 回复 -->
			<span style="color: gray;font-size: 12px;">{{item.createTime.replace(/[T]/,' ').replace(/\.\S*/,'')}}</span>
			<span class="replyBtn" @click="replyHandle(index,0,1)">回复({{ item.replies.length }})</span>
		</div>

		<!-- 图片上传弹框 -->
		<popup
		  v-model="visible"
		  popup-transition="popup-fade"
		  class="imgPop">
		  <div class="" >
		  	<p style="padding-bottom: 10px;color: #535353">至多可提交3张图片</p>
		  	<img :src="preview0" v-if=" preview0 !== '' " height="70px" style="margin-left: 20px;">
		  	<img :src="preview1" v-if=" preview1 !== '' " height="70px" style="margin-left: 20px;">
		  	<img :src="preview2" v-if=" preview2 !== '' " height="70px" style="margin-left: 20px;">
		  	<i class="fa fa-plus-square-o" 
		  	aria-hidden="true" 
		  	@click="upLoad" 
		  	style="font-size: 70px;margin-left: 5%;" v-if=" preview2 == '' "></i>
		  	<input id="uploadImg" @change="handleInputChange" type="file" :value="inputimg" accept="image/*" style="display: none">
        <div style="height: 40px;"></div>
		  	<div style="position: absolute;bottom: 15px;left:0;width: 100%;">
		  		<mt-button @click="comfirmUpload" style="width: 40%;margin-left: 5%">确定</mt-button>
		  		<mt-button @click="cancleUpload" style="width: 40%;float:right;margin-right: 5%">取消</mt-button>
		  	</div>
		  </div>
		</popup>

		<!-- 回复的弹框 -->
		 <popup
		  v-model="replyVisible"
		  position="right"
		  class="replyPop"
		  modal="false">
		    <!-- header -->
			  <div>
			  	<i class="fa fa-angle-left" aria-hidden="true" @click="replyVisible=false" style="font-size: 40px;font-weight: 200;padding: 5px 18px;"></i>
			  </div>
        <!-- 评论 -->
		    <div style="margin: 10px 20px 0 20px;">
		    	<div>
		    		<img src="./logo.png" class="userPhoto">
						<span class="name">ID:{{this.commentObj.accountId}}</span>
						<!-- 回复 点赞等 -->
						<div class="replyBtnCell">
							<!-- 点赞 -->
							<i @click="approveHandle(-1,0,1)" :id="'approvepop' + commentObj.id" class="fa fa-thumbs-o-up" aria-hidden="true" style="font-size: 20px;"></i>
							<span>{{this.approveL}}</span>
							<span class="replyBtn" @click="replyHandle(-1,0,1)">回复</span>
						</div>
					  <div style="clear:both;"></div>
		    	</div>
		    	<!-- 头部内容分割 -->
					<p class="text">{{this.commentObj.text}}</p>
					<img :src="commentObj.image" width="100px;">
		    </div>
		    <hr>
		    <p style="color: gray;padding: 5px;">共{{this.replyList.length}}条回复</p>
        <!-- 回复 -->
        <div style="margin: 10px 20px 0 20px;" v-for="(reply,i) in replyList">
					<div>
						<img src="./logo.png" class="userPhoto">
						<span class="name" style="font-size: 16px;">ID:{{reply.accountId}}</span>
						<span style="font-size: 14px;color:gray">@:</span>
					  <span class="name" style="font-size: 16px;padding-left: 0">ID:{{reply.sourceId}}</span>
						<div class="replyBtnCell">
							<!-- 点赞reply-->
							<i @click="approveHandle(index,i,2)" :id="'approve' + reply.id" class="fa fa-thumbs-o-up" aria-hidden="true"></i>
							<span>{{reply.approve.length}}</span>
			        <!-- 回复reply -->
							<span class="replyBtn" @click="replyHandle(-1,i,2)">回复</span>
						</div>
					</div>
					<!-- reply内容 -->
					<p class="text">{{reply.text}}</p>
				  <div class="imgBox">
						<img @click="showImg(img)" v-for="(img,index) in reply.images" class="textImg" :src="img" width="70px" height="70px">
				  </div>
				</div>
		 </popup>

		 <popup
		  v-model="rrVisible"
		  position="right"
		  class="reply">
		   	<mt-field class="replyInput" placeholder="请输入回复" v-model="replyText"></mt-field>
		  	<div style="text-align: left;margin-top: 5px;" >
			  	<p style="font-size: 12px;color:gray;margin:0 12px">至多可提交3张图片</p>
			  	<img :src="preview0" v-if=" preview0 !== '' " height="70px" style="margin-left: 10px;">
			  	<img :src="preview1" v-if=" preview1 !== '' " height="70px" >
			  	<img :src="preview2" v-if=" preview2 !== '' " height="70px" >
			  	<i class="fa fa-plus-square-o" 
			  	aria-hidden="true" 
			  	@click="upLoad" 
			  	style="font-size: 70px;margin-left: 5%;" v-if=" preview2 == '' "></i>
			  	<input id="uploadImg" @change="handleInputChange" type="file" :value="inputimg" accept="image/*" style="display: none">
		    </div>
		  	<div style="position: absolute;bottom:15px;left:0;width: 100%;">
		  		<mt-button @click="confirmReply" style="width: 40%;margin-left: 5%;float: left">确定</mt-button>
		  	  <mt-button @click="cancleReply" style="width: 40%;margin-right: 5%;float:right">取消</mt-button>
		  	</div>
		 </popup>

		 <popup
		  v-model="showImgVisible"
		  position="right"
		  class="showImg">
		 	  <img :src="showImgUrl" width="100%;" height="100%">
		 </popup>


	</div>
</template>

<script>
import	"../../../assets/font-awesome/css/font-awesome.min.css"
import { MessageBox } from 'mint-ui';
import { Toast } from 'mint-ui';
import { Popup }   from 'mint-ui';
import { Indicator } from 'mint-ui';
import Viewer from 'viewerjs'
	export default{
		name:'Comment',
		props:['docId'],
		data(){
			return{
				commentId: '',
				approveList: [],
				index: -1,
			  commentList:[],
			  showIndex: [],
			  replyList:[],
			  approveCount: [],
			  myComment: '',
			  visible: false,
			  files:[],
			  uploadFile:[],
			  iconIs: 1,
			  replyVisible:false,
			  replyText:'',
			  replyIndex: -1,
			  replyId: -1,
			  change: false,
			  approveL:0,
			  rrVisible:false,
			  commentObj:{},
			  images:[],
			  preview0:'',
			  preview1:'',
			  preview2:'',
			  inputimg:'',
			  showImgUrl:'',
			  showImgVisible:false
			}
		},
		components:{
			'popup':Popup
		},
		mounted(){
			this.$nextTick(() => {
				this.pageinit();
			})
			this.$http.get('/docs/'+this.docId)
			.then(res=>{
				this.commentList = res.data.comments;
				console.log(this.commentList,'comment')
			})
		},
		methods:{
			pageinit(){
        
			},
			//评论
			comment(file){
				if(this.myComment == '' && this.preview0 == ''){
          Toast('请输入评论');
				}else{
					const formData = new FormData()
					formData.append('text',this.myComment);
					formData.append('docId',this.docId);
					for (var i = 0; i < this.uploadFile.length; i++) {
				    formData.append('files', this.uploadFile[i])
				  }
					Indicator.open();
					this.$http.post('/comments/',formData)
					.then(res=>{
						this.commentList.unshift(res.data);
						console.log(res.data,'res')
					}).then(()=>{
						Indicator.close();
						Toast({
						  message: '评论成功',
						  iconClass: 'icon icon-success',
						  position: 'bottom'
						});
					}).catch(()=>{
						Indicator.close();
						Toast({
						  message: '评论失败',
						  iconClass: 'icon icon-success',
						  position: 'bottom'
						});
					})
					
					console.log(this.commentList)
					this.myComment = '';
					this.cancleImage();
					this.iconIs = 1;
				}
				
			},
			// 点击上传图片按钮
			upLoad(){
				this.inputimg = '';
				document.getElementById('uploadImg').click();
			},
			//转换文件类型
			handleInputChange(e){
				console.log(e)
        this.files.push(event.target.files[0]);
        console.log(this.files)
        // 检查文件类型
		    if(['jpeg', 'png', 'gif', 'jpg'].indexOf(event.target.files[0].type.split("/")[1]) < 0){
		        // 自定义报错方式
		        Toast.error("文件类型仅支持 jpeg/png/gif！", 2000, undefined, false);
		        return;
		    }
		    this.transformToDataUrl(event.target.files[0]);
			},
			transformToDataUrl(file){
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
          let base64 = this.result;
          let img = new Image();
          img.src = base64;
        }
        if(this.preview0 == ''){
        	this.preview0 = URL.createObjectURL(file);
        }else if(this.preview1 == ''){
        	this.preview1 = URL.createObjectURL(file);
        }else{
          this.preview2 = URL.createObjectURL(file);
        }
        console.log(this.preview0,'0');
        console.log(this.preview1,'1')
			},
			// 确认上传图片
			comfirmUpload(){
				this.visible = false;
				this.uploadFile = this.files;
				this.iconIs = 2;
				console.log(this.uploadFile,'upload')
			},
			// 取消上传图片
			cancleUpload(){
				this.visible = false;
				this.cancleImage();
			},
			//删除图片相关
			cancleImage(){
        this.uploadFile = [];
				this.files = [];
				this.preview0 = '';
				this.preview1 = '';
				this.preview2 = '';
			},
			showImg(imgUrl){
        this.showImgUrl = imgUrl;
        this.showImgVisible = true;
			},
			//点击回复按钮
			replyHandle(index,i,type){
				let count = 0;
				if(index !== -1){
					this.index = index;
				}else{
					console.log(this.index,'this')
					index = this.index;
				}
			  this.commentObj = this.commentList[index];
			  this.approveL = this.commentObj.approve.length;
			  this.replyList = this.commentList[index].replies;
				this.replyVisible = true;
				this.rrVisible = true;
			  this.replyFormData = new FormData()
				this.replyFormData.append('commentId',this.commentList[index].id);
				console.log(i,'i')
				if(type === 1){
					this.replyFormData.append('sourceId',this.commentList[index].accountId);
				}else{
					this.replyFormData.append('sourceId',this.commentList[index].replies[i].accountId);
				}
				this.replyIndex = index;
			},
			// 确认回复
			confirmReply(){
				this.iconIs = 1;
				this.rrVisible = false;
				this.comfirmUpload();
				console.log(this.uploadFile,'replyupload')
				for (var i = 0; i < this.uploadFile.length; i++) {
				  this.replyFormData.append('files', this.uploadFile[i])
				}
				this.replyFormData.append('text',this.replyText);
        
				if(this.replyText == '' && this.preview0 == ''){
				
					Toast('请输入回复');
				}else{
					Indicator.open({position:'bottom'});
					this.preview0 = '';
					this.$http.post('/comments/' + this.commentList[this.replyIndex].id + '/reply',
						this.replyFormData)
					.then(res=>{
						console.log(res.data,'res')
						this.replyList = res.data.replies;
						this.commentList[this.index].replies = res.data.replies;
						this.cancleImage();
						this.replyText = '';
						Indicator.close();
						Toast({
						  message: '回复成功',
						  iconClass: 'icon icon-success',
						  position: 'bottom'
						});
						this.showReply(this.replyIndex);
					}).catch(()=>{
						Indicator.close();
						Toast({
						  message: '回复失败',
						  iconClass: 'icon icon-success',
						  position: 'bottom'
						});
					})
				}	
			},
			// 取消回复
			cancleReply(){
				console.log('reject');
				this.cancleImage();
				this.rrVisible = false;
				this.replyText = '';
			},
			// 显示回复列表
			showReply(index){
        // console.log(this.showIndex,'before')
        if(this.showIndex.indexOf(index) !== -1){
        	let i = this.showIndex.indexOf(index);
        	this.showIndex.splice(i,1)
        }else{
        	this.showIndex.push(index);
        }
			},
			// 点赞
			approveHandle(index,i,type){
				if(index === -1){
					index = this.index;
				}
        if(type === 1){//点赞评论
        	this.commentId = this.commentList[index].id;
        	this.accountId = this.commentList[index].accountId;
        	this.approveList = this.commentList[index].approve;
        }else{//点赞reply
        	this.commentId = this.commentList[index].replies[i].id;
        	this.accountId = this.commentList[index].replies[i].accountId;
        	this.approveList = this.commentList[index].replies[i].approve;
        }
        console.log(document.getElementById("approvepop"+this.commentId),'doc')
        //检查此评论是否被点赞过（查找list中有没有这个accountId）
        if(this.approveList.indexOf(this.accountId) == -1){
        	  document.getElementById("approve"+this.commentId).style.color = "#2196F3";
        	  if(document.getElementById("approvepop"+this.commentId)){
        	  	document.getElementById("approvepop"+this.commentId).style.color = "#2196F3";
        	  }
        	  console.log('ok')
	        	this.approveList.push(this.accountId);
	        	if(type === 1){
	        		this.approveL = this.approveList.length;
	        	}
	        	this.$http.put('/comments/' + this.commentId+ '/approve',{approve:true}).then((res)=>{
	        		console.log(res);
	        		console.log(this.commentList[index])
        	})
        }else{
        	let cancleIndex = this.approveList.indexOf(this.accountId);
        	this.approveList.splice(cancleIndex,1);
        	if(type === 1){
	        		this.approveL = this.approveList.length;
	        	}
          document.getElementById("approve"+this.commentId).style.color = "black";
          if(document.getElementById("approvepop"+this.commentId)){
        	  	document.getElementById("approvepop"+this.commentId).style.color = "black";
        	  }
        	this.$http.put('/comments/' + this.commentId + '/approve',{approve:false});
        }
			}
		}
	}
	
</script>

<style>
p{
   word-wrap:break-word; 
   margin: 5px;
}

.mint-indicator-wrapper{
	z-index: 2100 !important;
}

.mint-toast{
	z-index: 2100 !important;
}

.changeColor{
	color:blue;
}

.line{
    display: inline-block;
    width: 100%;
    border:0.5px solid #ddd;
    text-align: center;
}
.top{
	margin-bottom: 10px;
}
.commentContainer{
  margin: 10px;
  margin-bottom: 60px;
}
	a.commentInput{
	  border-top:1px solid lightgray;
	  position: fixed;
	  bottom: 0px;
	  left: 0px;
	  width: 100%;
    z-index: 100 !important;
	}
	.showImg{
		width: 80%;
	  margin-right: 10%;
	}
	.imgPop{
		box-sizing: border-box;
    text-align: left;
    width: 90%;
    min-height: 200px;
    max-height: 400px;
   /* height: 200px;*/
    border-radius: 3px;
    margin-right: 5%;
    padding: 10px;
	}
	.commentCell{
		text-align: left;
		margin: 5px 0;
		padding: 5px;
		background-color: rgba(212, 212, 212, 0.24);
		border-radius: 3px;
	}
		.userPhoto{
			width: 25px;
			height:25px;
			border-radius: 50%;
			border:1px solid lightgray;
			float: left;
		}
    .name{
    	display: inline-block;
	    padding: 5px;
	    font-size: 15px;
	    color:#607D8B;
    }
    .imgBox{
			display: block;
    	margin-left: 30px;
		}
		.text{
			margin: 0 5px;
			padding-left: 25px;
			width: 80%;
		}
    .textImg{
    	padding: 5px;
    	font-size: 14px;
    	display: inline-block;
    }
		.replyBtnCell{
			float:right;
		}
			.replyBtn{
				font-size: 14px;
				color:#60898b;
				padding: 0 8px;
			}
			.replyBtn:hover{
			    cursor: pointer;
			    color:lightblue;
			}
			.replyPop{
				text-align: left;
		    width: 100%;
		    height: 100%;
		    overflow: scroll;
			}
			.reply{
				width: 90%;
				height: 230px;
				margin-right: 5%;
			}
			.replyInput{
        border: 1px solid lightgray;
        border-radius: 5px;
        margin: 20px 10px;
        margin-bottom: 0px;
			}
		.replyCell{
			margin-top: -10px;
		}


</style>