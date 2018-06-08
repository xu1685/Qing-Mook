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
        v-if='!isShowUploadImageIcon'
        @click='isShowUploadImagesDialog = true'
      />
      <img
        width='35px'
        v-if='isShowUploadImageIcon'
        :src='preview0'
      />
      <mt-button
        style='margin-left: 10px; height: 35px; background-color: #418642; color: #FFF'
        @click='confirmComment()'
      >
        提交
      </mt-button>
    </mt-field>

    <!-- 评论容器 -->
    <div
      class='commentCell'
      v-for='(comment, index) in commentList'
      :key='comment.id'
    >
      <div class='commentTop'>
        <img
          class='avatar'
          :src='comment.avatar'
        />
        <span class='userName'>{{comment.userName}}</span>
        <div class='approve'>
          <i
            class='fa fa-thumbs-o-up'
            style='font-size: 18px; margin-right: 5px;'
            :id='"approve" + comment.id'
            @click='approveHandle(index, 0, 1)'
          />
          <span>{{comment.approve.length}}</span>
        </div>
      </div>
      <p class='text'>{{comment.text}}</p>
      <div
        class='imagesBox'
        v-if='comment.images.length'
      >
        <img
          class='textImg'
          :src='img'
          v-for='img in comment.images'
          @click='showImg(img)'
        >
      </div>
      <span style='color: gray; font-size: 12px;'>
        {{formatTime(comment.createTime)}}
      </span>
      <span
        class='replyBtn'
        @click='handleOnReply(index, 0, 1)'
      >
        回复({{comment.replies.length}})
      </span>
    </div>
    <h3 v-if='!commentList.length' style='color: gray'>暂无评论，快来评论吧！</h3>

    <!-- 图片上传弹框 -->
    <mt-popup
      class='imagesUploadDialog'
      popup-transition='popup-fade'
      v-model='isShowUploadImagesDialog'
    >
      <div>
        <p style='padding-bottom: 10px; color: #555'>最多可上传3张图片</p>
        <div style='display: flex; align-items: center;'>
          <img :src='preview0' v-if='preview0 !== ""' height='100px' style='border-radius: 5px; border: solid 1px #DDD; margin-right: 10px;'>
          <img :src='preview1' v-if='preview1 !== ""' height='100px' style='border-radius: 5px; border: solid 1px #DDD; margin-right: 10px;'>
          <img :src='preview2' v-if='preview2 !== ""' height='100px' style='border-radius: 5px; border: solid 1px #DDD; margin-right: 10px;'>
          <i
            class='fa fa-plus-square-o'
            style='font-size: 100px; padding-left: 10px; padding-right: 10px; border-radius: 5px; border: solid 1px #DDD;'
            v-if='preview2 === ""'
            @click='clickUploadImageInputForComment'
          />
          <input
            ref='uploadImageInputForComment'
            accept='image/*'
            type='file'
            multiple
            style='display: none'
            :value='inputImage'
            @change='handleInputChange'
          />
        </div>
        <div style='display: flex; justify-content: center; align-self: center; margin-top: 30px;'>
          <mt-button
            style='margin-right: 10px; padding-left: 30px; padding-right: 30px;'
            @click='comfirmUpload'
          >
            确定
          </mt-button>
          <mt-button
            style='margin-left: 10px; padding-left: 30px; padding-right: 30px;'
            @click='cancleUpload'
          >
            取消
          </mt-button>
        </div>
      </div>
    </mt-popup>

    <!-- 回复的弹框 -->
    <mt-popup
      class='replyPop'
      position='right'
      v-if='Object.keys(commentObj)'
      v-model='replyVisible'
    >
      <div>
        <mt-button
          style='margin-top: 10px; margin-bottom: 10px; padding-left: 10px; padding-right: 10px;'
          @click='replyVisible = false'
        >
          返回
        </mt-button>
      </div>
      <div class='commentCell'>
        <div class='commentTop'>
          <img
            class='avatar'
            :src='commentObj.avatar'
          />
          <span class='userName'>{{commentObj.userName}}</span>
          <div class='approve'>
            <i
              class='fa fa-thumbs-o-up'
              style='font-size: 18px; margin-right: 5px;'
              :id='"approvepop" + commentObj.id'
              @click='approveHandle(-1, 0, 1)'
            />
            <span>{{approveL}}</span>
          </div>
        </div>
        <p class='text'>{{commentObj.text}}</p>
        <div
          class='imagesBox'
          v-if='commentObj.images && commentObj.images.length'
        >
          <img
            class='textImg'
            :src='img'
            v-for='img in commentObj.images'
            @click='showImg(img)'
          >
        </div>
        <span style='color: gray; font-size: 12px;'>
          {{formatTime(commentObj.createTime)}}
        </span>
        <span
          class='replyBtn'
          @click='handleOnReply(-1, 0, 1)'
        >
          回复({{replyList.length}})
        </span>
      </div>
      <hr>
      <div
        class='commentCell'
        v-for='(reply, i) in replyList'
      >
        <div class='commentTop'>
          <img
            class='avatar'
            :src='reply.avatar'
          />
          <span class='userName'>{{reply.userName}}</span>
          <span style='font-size: 14px; color:gray; margin-left: 5px; margin-right: 5px;'>@:</span>
          <span class='userName'>{{reply.originUserName}}</span>
          <div class='approve'>
            <i
              class='fa fa-thumbs-o-up'
              style='font-size: 18px; margin-right: 5px;'
              :id='"approve" + reply.id'
              @click='approveHandle(index, i, 2)'
            />
            <span>{{reply.approve.length}}</span>
          </div>
        </div>
        <p class='text'>{{reply.text}}</p>
        <div
          class='imagesBox'
          v-if='reply.images.length'
        >
          <img
            class='textImg'
            :src='img'
            v-for='img in reply.images'
            @click='showImg(img)'
          />
        </div>
        <span style='color: gray; font-size: 12px;'>
          {{formatTime(reply.createTime)}}
        </span>
        <span
          class='replyBtn'
          @click='handleOnReply(-1, i, 2)'
        >
          回复
        </span>
      </div>
    </mt-popup>

    <!-- 回复对话框 -->
    <mt-popup
      class='imagesUploadDialog'
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
          style='font-size: 70px;margin-left: 5%;' v-if=' preview2 === "" '
          @click='clickUploadImageInputForReply'
        />
        <input
          ref='uploadImageInputForReply'
          type='file'
          accept='image/*'
          multiple
          style='display: none'
          :value='inputImage'
          @change='handleInputChange'
        >
      </div>
      <div style='display: flex; justify-content: center; align-self: center; margin-top: 30px;'>
        <mt-button
          style='margin-right: 10px; padding-left: 30px; padding-right: 30px;'
          @click='confirmReply'
        >
          确定
        </mt-button>
        <mt-button
          style='margin-left: 10px; padding-left: 30px; padding-right: 30px;'
          @click='cancleReply'
        >
          取消
        </mt-button>
      </div>
    </mt-popup>

    <mt-popup
      position='right'
      class='showImg'
      v-model='showImgVisible'
    >
      <img
        style='width: 100%; height: 100%;'
        :src='showImgUrl'
      />
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
      images: [],
      index: -1,
      inputImage: '',
      isShowUploadImageIcon: false,
      isShowUploadImagesDialog: false,
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
    }
  },

  watch: {
    comments() {
      this.commentList = this.comments
    }
  },

  methods: {
    confirmComment() {
      if (this.myComment === '' && this.preview0 === '') {
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
        this.isShowUploadImageIcon = false

        /* 清空上传图片相关 */
        this.cancleImage()
      }
    },

    /* 处于评论状态时点击上传图片按钮 */
    clickUploadImageInputForComment() {
      this.inputImage = ''
      this.$refs.uploadImageInputForComment.click()
    },

    /* 处于回复状态时点击上传图片按钮 */
    clickUploadImageInputForReply() {
      this.inputImage = ''
      this.$refs.uploadImageInputForReply.click()
    },

    /* 转换文件类型 */
    handleInputChange(event) {
      if (event.target.files) {
        this.files = Array.from(event.target.files)
        this.transformToDataUrl(this.files)
      }
    },

    transformToDataUrl(files) {
      for (let i = 0; i < 3; i++) {
        if (files[i]) {
          if (this.preview0 === '') {
            this.preview0 = URL.createObjectURL(files[i])
          } else if (this.preview1 === '') {
            this.preview1 = URL.createObjectURL(files[i])
          } else {
            this.preview2 = URL.createObjectURL(files[i])
          }
        }
      }
    },

    /* 确认上传图片 */
    comfirmUpload() {
      this.isShowUploadImagesDialog = false
      this.uploadFile = this.files
      this.isShowUploadImageIcon = true
    },

    /* 取消上传图片 */
    cancleUpload() {
      this.isShowUploadImagesDialog = false
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
    handleOnReply(index, i, type) {
      if (index !== -1) {
        this.index = index
      } else {
        index = this.index
      }
      this.commentObj = this.commentList[index]
      this.approveL = this.commentObj.approve.length
      this.replyList = this.commentObj.replies
      this.replyVisible = true
      this.rrVisible = true
      this.replyFormData = new FormData()
      this.replyFormData.append('commentId', this.commentObj.id)

      if (type === 1) {
        this.replyFormData.append('sourceId', this.commentObj.accountId)
      } else {
        this.replyFormData.append('sourceId', this.commentObj.replies[i].accountId)
      }
      this.replyIndex = index
    },

    /* 确认回复 */
    confirmReply() {
      this.isShowUploadImageIcon = false
      this.rrVisible = false
      this.comfirmUpload()
      for (let i = 0; i < this.uploadFile.length; i++) {
        this.replyFormData.append('files', this.uploadFile[i])
      }
      this.replyFormData.append('text', this.replyText)

      if (this.replyText === '' && this.preview0 === '') {
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
      if (this.approveList.indexOf(this.accountId) === -1) {
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

    /* 格式化时间 */
    formatTime(time) {
      const parseTime = new Date(time)

      return `${parseTime.getFullYear()}-${parseTime.getMonth() + 1}-${parseTime.getDate()} ${this.paddingNumberWithZero(parseTime.getHours())}:${this.paddingNumberWithZero(parseTime.getMinutes())}:${this.paddingNumberWithZero(parseTime.getSeconds())}`
    },

    /* 针对只有个位的数字，返回一个前置补零的字符串 */
    paddingNumberWithZero(number) {
      return number > 9 ? String(number) : `0${number}`
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

.commentTop {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
}

.avatar {
  width: 25px;
  height: 25px;
  border: 1px solid lightgray;
  border-radius: 50%;
}

.userName {
  font-size: 16px;
  color: #5082B4;
  margin-left: 5px;
}

.approve {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(0, -50%);
  display: inline-flex;
  align-items: center;
}

.text {
  padding: 5px 30px;
  word-wrap: break-word;
}

.imagesBox {
  padding-left: 30px;
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

.imagesUploadDialog {
  box-sizing: border-box;
  min-width: 80%;
  min-height: 200px;
  max-height: 400px;
  padding: 10px;
  border-radius: 5px;
}

.textImg {
  width: 60px;
  height: 60px;
  font-size: 14px;
  display: inline-block;
  padding: 5px;
}

.replyPop {
  overflow: auto;
  width: 100%;
  height: 100%;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
}

.replyBtnCell {
  float: right;
}

.replyBtn {
  font-size: 14px;
  padding: 0 8px;
  color: #60898b;
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
