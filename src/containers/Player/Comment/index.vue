<template>
  <div class='commentContainer'>

    <!-- 评论输入框 -->
    <mt-field
      class='commentInput'
      placeholder='评论'
      disableClear
      v-model='myComment'
    >
      <i
        class='fa fa-picture-o'
        style='font-size: 20px;'
        v-if='!isShowUploadImage'
        @click='visible=true'
      />
      <img
        width='35px'
        v-if='isShowUploadImage'
        :src='this.preview0'
      />
      <mt-button
        style='margin-left: 10px; height: 35px;'
        @click='confirmComment()'
      >
        提交
      </mt-button>
    </mt-field>

    <!-- 评论容器 -->
    <div
      class='commentCell'
      v-for='comment in commentList'
      :key='comment.id'
    >
      <!-- 用户头像名称 -->
      <img
        class='userPhoto'
        src='./logo.png'
        :id='"photo" + index'
      />
      <span class='name'>{{comment.accountId}}</span>
      <!-- 回复 点赞等 -->
      <div class='replyBtnCell'>
        <!-- 点赞 -->
        <i
          class='fa fa-thumbs-o-up'
          style='font-size: 20px;'
          :id='"approve" + comment.id'
          @click='approveHandle(index,0,1)'
        />
        <span>{{comment.approve.length}}</span>
      </div>
      <!-- 评论内容 -->
      <p class='text'>{{comment.text}}</p>
      <div class='imgBox'>
        <img @click='showImg(img)' v-for='(img,index) in comment.images' class='textImg' :src='img' width='60px' height='60px'>
      </div>
      <!-- 回复 -->
      <span style='color: gray;font-size: 12px;'>{{comment.createTime.replace(/[T]/,' ').replace(/\.\S*/,'')}}</span>
      <span class='replyBtn' @click='replyHandle(index,0,1)'>回复({{ comment.replies.length }})</span>
    </div>
    <h3 v-if='!commentList.length' style='color: gray'>暂无评论，快来评论吧！</h3>

    <!-- 图片上传弹框 -->
    <mt-popup
      v-model='visible'
      popup-transition='popup-fade'
      class='imgPop'
    >
      <div>
        <p style='padding-bottom: 10px;color: #535353'>至多可提交3张图片</p>
        <img :src='preview0' v-if=' preview0 !== "" ' height='70px' style='margin-left: 20px;'>
        <img :src='preview1' v-if=' preview1 !== "" ' height='70px' style='margin-left: 20px;'>
        <img :src='preview2' v-if=' preview2 !== "" ' height='70px' style='margin-left: 20px;'>
        <i class='fa fa-plus-square-o'
        aria-hidden='true'
        @click='upLoad'
        style='font-size: 70px;margin-left: 5%;' v-if='preview2 == ""'></i>
        <input id='uploadImg' @change='handleInputChange' type='file' :value='inputimg' accept='image/*' style='display: none' multiple>
        <div style='height: 40px;'></div>
        <div style='position: absolute;bottom: 15px;left:0;width: 100%;'>
          <mt-button @click='comfirmUpload' style='width: 40%;margin-left: 5%'>确定</mt-button>
          <mt-button @click='cancleUpload' style='width: 40%;float:right;margin-right: 5%'>取消</mt-button>
        </div>
      </div>
    </mt-popup>

    <!-- 回复的弹框 -->
    <mt-popup
      v-model='replyVisible'
      position='right'
      class='replyPop'
      modal='false'
    >
      <!-- header -->
      <div>
        <i class='fa fa-angle-left' aria-hidden='true' @click='replyVisible=false' style='font-size: 40px;font-weight: 200;padding: 5px 18px;'></i>
      </div>
      <!-- 评论 -->
      <div style='margin: 10px 20px 0 20px;'>
        <div>
          <img src='./logo.png' class='userPhoto'>
          <span class='name'>ID:{{this.commentObj.accountId}}</span>
          <!-- 回复 点赞等 -->
          <div class='replyBtnCell'>
            <!-- 点赞 -->
            <i @click='approveHandle(-1,0,1)' :id='"approvepop" + commentObj.id' class='fa fa-thumbs-o-up' aria-hidden='true' style='font-size: 20px;'></i>
            <span>{{this.approveL}}</span>
            <span class='replyBtn' @click='replyHandle(-1,0,1)'>回复</span>
          </div>
          <div style='clear:both;'></div>
        </div>
        <!-- 头部内容分割 -->
        <p class='text'>{{this.commentObj.text}}</p>
        <div class='imgBox'>
          <img @click='showImg(img)' v-for='(img,index) in commentObj.images' class='textImg' :src='img' width='60px' height='60px'>
        </div>
      </div>
      <hr>
      <p style='color: gray;padding: 5px;'>共{{this.replyList.length}}条回复</p>
      <!-- 回复 -->
      <div style='margin: 10px 20px 0 20px;' v-for='(reply,i) in replyList'>
        <div>
          <img src='./logo.png' class='userPhoto'>
          <span class='name' style='font-size: 16px;'>ID:{{reply.accountId}}</span>
          <span style='font-size: 14px;color:gray'>@:</span>
          <span class='name' style='font-size: 16px;padding-left: 0'>ID:{{reply.sourceId}}</span>
          <div class='replyBtnCell'>
            <!-- 点赞reply-->
            <i @click='approveHandle(index,i,2)' :id=''approve' + reply.id' class='fa fa-thumbs-o-up' aria-hidden='true'></i>
            <span>{{reply.approve.length}}</span>
            <!-- 回复reply -->
            <span class='replyBtn' @click='replyHandle(-1,i,2)'>回复</span>
          </div>
        </div>
        <!-- reply内容 -->
        <p class='text'>{{reply.text}}</p>
        <div class='imgBox'>
          <img @click='showImg(img)' v-for='(img,index) in reply.images' class='textImg' :src='img' width='70px' height='70px'>
        </div>
      </div>
    </mt-popup>


    <mt-popup
      class='reply'
      position='right'
      v-model='rrVisible'
    >
      <mt-field
        class='replyInput'
        placeholder='请输入回复'
        v-model='replyText'
      />
      <div style='text-align: left;margin-top: 5px;'>
        <p style='font-size: 12px;color:gray;margin:0 12px'>至多可提交3张图片</p>
        <img :src='preview0' v-if=' preview0 !== "" ' height='70px' style='margin-left: 10px;'>
        <img :src='preview1' v-if=' preview1 !== "" ' height='70px' >
        <img :src='preview2' v-if=' preview2 !== "" ' height='70px' >
        <i
          class='fa fa-plus-square-o'
          style='font-size: 70px;margin-left: 5%;' v-if=' preview2 == "" '
          @click='upLoad'
        />
        <input
          id='uploadImg'
          type='file'
          accept='image/*'
          multiple
          style='display: none'
          :value='inputimg'
          @change='handleInputChange'
        >
      </div>
      <div style='position: absolute;bottom:15px;left:0;width: 100%;'>
        <mt-button @click='confirmReply' style='width: 40%;margin-left: 5%;float: left'>确定</mt-button>
        <mt-button @click='cancleReply' style='width: 40%;margin-right: 5%;float:right'>取消</mt-button>
      </div>
    </mt-popup>

    <mt-popup
      position='right'
      class='showImg'
      v-model='showImgVisible'
    >
      <img :src='showImgUrl' width='100%;' height='100%'>
    </mt-popup>
  </div>
</template>

<script>

import { Toast } from 'mint-ui'
import { Indicator } from 'mint-ui'
import Viewer from 'viewerjs'

export default {
  name: 'Comment',

  props: {
    docId: {
      type: String,
      required: true,
    },
    comments: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      approveCount: [],
      approveL: 0,
      approveList: [],
      change: false,
      commentId: '',
      commentList: this.comments,
      commentObj: {},
      files: [],
      isShowUploadImage: false,
      images: [],
      index: -1,
      inputimg: '',
      myComment: '',
      preview0: '',
      preview1: '',
      preview2: '',
      replyId: -1,
      replyIndex: -1,
      replyList: [],
      replyText: '',
      replyVisible: false,
      rrVisible: false,
      showImgUrl: '',
      showImgVisible: false,
      showIndex: [],
      uploadFile: [],
      visible: false,
    }
  },

  watch: {
    comments() {
      this.commentList = this.comments
    }
  },

  methods: {
    confirmComment() {
      if (this.myComment == '' && this.preview0 == '') {
        Toast('请输入评论')
      } else {
        const formData = new FormData()
        formData.append('text', this.myComment)
        formData.append('docId', this.docId)
        for (let i = 0; i < this.uploadFile.length; i++) {
          formData.append('files', this.uploadFile[i])
        }

        /* 显示上传评论提示 */
        Indicator.open()

        this
          .$http
          .post('/comments/', formData)
          .then((res) => {
            this.commentList.unshift(res.data)
          }).then(() => {
            /* 关闭上传评论提示 */
            Indicator.close()

            Toast({
              message: '评论成功',
              iconClass: 'fa fa-check',
            })
          }).catch(() => {
            /* 关闭上传评论提示 */
            Indicator.close()

            Toast({
              message: '评论失败',
              iconClass: 'fa fa-exclamation-triangle',
            })
          })

        this.myComment = ''
        this.isShowUploadImage = false

        /* 清空上传图片相关 */
        this.cancleImage()
      }
    },

    /* 点击上传图片按钮 */
    upLoad() {
      this.inputimg = ''
      document.getElementById('uploadImg').click()
    },
    /* 转换文件类型 */
    handleInputChange(e) {
      this.files = []
      console.log(e.target.files, 'files')
      const len = e.target.files.length - 1
      for (let i = len; i > len - 3; i--) {
        if (event.target.files[i]) {
          this.files.push(event.target.files[i])
        }
      }
      console.log(this.files)
      /* 检查文件类型 */
        if (['jpeg', 'png', 'gif', 'jpg'].indexOf(event.target.files[0].type.split('/')[1]) < 0) {
          /* 自定义报错方式 */
          Toast.error('文件类型仅支持 jpeg/png/gif！', 2000, undefined, false)
          return
        }
        this.transformToDataUrl(this.files)
    },
    transformToDataUrl(files) {
      for (let i = 0; i < 3; i++) {
        const reader = new FileReader()
        if (files[i]) {
            reader.readAsDataURL(files[i])
            reader.onload = function (e) {
              const base64 = this.result
              const img = new Image()
              img.src = base64
            }
            if (this.preview0 == '') {
              this.preview0 = URL.createObjectURL(files[i])
            } else if (this.preview1 == '') {
              this.preview1 = URL.createObjectURL(files[i])
            } else {
              this.preview2 = URL.createObjectURL(files[i])
            }
        }
      }
    },

    /* 确认上传图片 */
    comfirmUpload() {
      this.visible = false
      this.uploadFile = this.files
      this.isShowUploadImage = true
    },

    /* 取消上传图片 */
    cancleUpload() {
      this.visible = false
      this.cancleImage()
    },

    /* 删除图片相关 */
    cancleImage() {
      this.uploadFile = []
      this.files = []
      this.preview0 = ''
      this.preview1 = ''
      this.preview2 = ''
    },

    showImg(imgUrl) {
      this.showImgUrl = imgUrl
      this.showImgVisible = true
    },

    /* 点击回复按钮 */
    replyHandle(index, i, type) {
      const count = 0
      if (index !== -1) {
        this.index = index
      } else {
        index = this.index
      }
      this.commentObj = this.commentList[index]
      this.approveL = this.commentObj.approve.length
      this.replyList = this.commentList[index].replies
      this.replyVisible = true
      this.rrVisible = true
      this.replyFormData = new FormData()
      this.replyFormData.append('commentId', this.commentList[index].id)

      if (type === 1) {
        this.replyFormData.append('sourceId', this.commentList[index].accountId)
      } else {
        this.replyFormData.append('sourceId', this.commentList[index].replies[i].accountId)
      }
      this.replyIndex = index
    },

    /* 确认回复 */
    confirmReply() {
      this.isShowUploadImage = false
      this.rrVisible = false
      this.comfirmUpload()
      for (let i = 0; i < this.uploadFile.length; i++) {
        this.replyFormData.append('files', this.uploadFile[i])
      }
      this.replyFormData.append('text', this.replyText)

      if (this.replyText == '' && this.preview0 == '') {
        Toast('请输入回复')
      } else {
        Indicator.open({ position: 'bottom' })
        this.preview0 = ''
        this
          .$http
          .post(`/comments/${this.commentList[this.replyIndex].id}/reply`, this.replyFormData)
          .then((res) => {
            this.replyList = res.data.replies
            this.commentList[this.index].replies = res.data.replies
            this.cancleImage()
            this.replyText = ''
            Indicator.close()
            Toast({
              message: '回复成功',
              iconClass: 'icon icon-success',
              position: 'bottom',
            })
            this.showReply(this.replyIndex)
          })
          .catch(() => {
            Indicator.close()
            Toast({
              message: '回复失败',
              iconClass: 'icon icon-success',
              position: 'bottom',
            })
          })
      }
    },

    /* 取消回复 */
    cancleReply() {
      this.cancleImage()
      this.rrVisible = false
      this.replyText = ''
    },

    /* 显示回复列表 */
    showReply(index) {
      if (this.showIndex.indexOf(index) !== -1) {
        const i = this.showIndex.indexOf(index)
        this.showIndex.splice(i, 1)
      } else {
        this.showIndex.push(index)
      }
    },

    /* 点赞 */
    approveHandle(index, i, type) {
      if (index === -1) {
        index = this.index
      }
      if (type === 1) {
        /* 点赞评论 */
        this.commentId = this.commentList[index].id
        this.accountId = this.commentList[index].accountId
        this.approveList = this.commentList[index].approve
      } else {
        /* 点赞回复 */
        this.commentId = this.commentList[index].replies[i].id
        this.accountId = this.commentList[index].replies[i].accountId
        this.approveList = this.commentList[index].replies[i].approve
      }
      /* 检查此评论是否被点赞过（查找list中有没有这个accountId） */
      if (this.approveList.indexOf(this.accountId) == -1) {
        document.getElementById(`approve${this.commentId}`).style.color = '#2196F3'
        if (document.getElementById(`approvepop${this.commentId}`)) {
          document.getElementById(`approvepop${this.commentId}`).style.color = '#2196F3'
        }
        this.approveList.push(this.accountId)
        if (type === 1) {
          this.approveL = this.approveList.length
        }
        this
          .$http
          .put(`/comments/${this.commentId}/approve`, { approve: true })
      } else {
        const cancleIndex = this.approveList.indexOf(this.accountId)
        this.approveList.splice(cancleIndex, 1)
        if (type === 1) {
          this.approveL = this.approveList.length
        }
        document.getElementById(`approve${this.commentId}`).style.color = 'black'
        if (document.getElementById(`approvepop${this.commentId}`)) {
          document.getElementById(`approvepop${this.commentId}`).style.color = 'black'
        }
        this.$http.put(`/comments/${this.commentId}/approve`, { approve: false })
      }
    },
  },
}

</script>

<style scoped>

.commentContainer {
  margin: 10px 10px 60px;
}

.commentInput {
  position: fixed;
  z-index: 200;
  bottom: 0;
  left: 0;
  width: 100%;
  border-top: 1px solid #AAA;
}

.commentCell {
  margin-bottom: 10px;
  padding: 5px;
  border-radius: 5px;
  background-color: #EEE;
}

p {
  word-wrap: break-word;
}

.mint-indicator-wrapper {
  z-index: 2100 !important;
}

.mint-toast {
  z-index: 2100 !important;
}

.changeColor {
  color: blue;
}

.line {
  display: inline-block;
  width: 100%;
  text-align: center;
  border: 0.5px solid #ddd;
}

.top {
  margin-bottom: 10px;
}

.showImg {
  width: 80%;
  margin-right: 10%;
}

.imgPop {
  box-sizing: border-box;
  width: 90%;
  min-height: 200px;
  max-height: 400px;
  margin-right: 5%;
  padding: 10px;
  text-align: left;
  border-radius: 3px;
}

.userPhoto {
  float: left;
  width: 25px;
  height: 25px;
  border: 1px solid lightgray;
  border-radius: 50%;
}

.name {
  font-size: 15px;
  display: inline-block;
  padding: 5px;
  color: #607D8B;
}

.imgBox {
  display: block;
  margin-left: 30px;
}

.text {
  width: 80%;
  margin: 0 5px;
  padding-left: 25px;
}

.textImg {
  font-size: 14px;
  display: inline-block;
  padding: 5px;
}

.replyBtnCell {
  float: right;
}

.replyBtn {
  font-size: 14px;
  padding: 0 8px;
  color: #60898b;
}

.replyBtn:hover {
  cursor: pointer;
  color: lightblue;
}

.replyPop {
  overflow: scroll;
  width: 100%;
  height: 100%;
  text-align: left;
}

.reply {
  width: 90%;
  height: 230px;
  margin-right: 5%;
}

.replyInput {
  margin: 20px 10px;
  margin-bottom: 0px;
  border: 1px solid lightgray;
  border-radius: 5px;
}

.replyCell {
  margin-top: -10px;
}

</style>
