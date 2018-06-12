<template>
  <div class='container'>
    <div
      ref='playerWrapper'
      :style='selected === "subtitles" ? {
        position: "fixed",
        left: "0",
        top: "0",
        zIndex: "100",
        width: "100%",
      } : undefined'
    >
      <MyHeader :title='title' />
      <div
        id="player"
        @actionsLoaded='handleOnSetSubtitleContainerMarginTop'
        @subtitlechange='handleOnSubtitleChange'
      />
      <mt-navbar
        class='selectToolBar'
        v-model='selected'
      >
        <mt-tab-item
          id='comment'
          :style='selected === "comment" ? { borderBottom: "3px solid #418642" } : undefined'
        >
          <span
            style='font-size: 18px; color: #666; font-weight: 800;'
            :style='selected === "comment" ? { color: "#418642" } : undefined'
          >
            评论
          </span>
        </mt-tab-item>
        <mt-tab-item
          id='subtitles'
          :style='selected === "subtitles" ? { borderBottom: "3px solid #418642" } : undefined'
        >
          <span
            style='font-size: 18px; color: #666; font-weight: 800;'
            :style='selected === "subtitles" ? { color: "#418642" } : undefined'
          >
            字幕
          </span>
        </mt-tab-item>
      </mt-navbar>
    </div>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='comment'>
        <Score
          :accountId='accountId'
          :score='score'
          :teacherInformation='teacherInformation'
        />
        <Comment
          :docId='docId'
          :comments='comments'
          @addCommentSuccess='handleOnAddCommentSuccess'
          @addReplySuccess='handleOnAddReplySuccess'
        />
      </mt-tab-container-item>
      <mt-tab-container-item id='subtitles'>
        <Subtitles
          :subtitles='subtitles'
          :activeSubtitleIndex='activeSubtitleIndex'
          :subtitleContainerMarginTop='subtitleContainerMarginTop'
        />
      </mt-tab-container-item>
    </mt-tab-container>
  </div>
</template>

<script>

import '../Player/Player/src/Player.css'

import MyHeader from '../MyHeader'
import Player from '../Player/Player/src/Player.js'
import Comment from './Comment'
import Score from './Score'
import Subtitles from './Subtitles'
import {
  configWeiXinShare,
  initWeiXinShareConfig,
} from '../../utils/weixin'

export default {
  name: 'Player',

  data() {
    return {
      accountId: -1,
      activeSubtitleIndex: -1,
      comments: [],
      docId: '',
      myInformation: {},
      pictures: [],
      player: {},
      score: -1,
      selected: 'comment',
      subtitleContainerMarginTop: 0,
      subtitles: [],
      teacherInformation: {},
      title: '课程名称',
      usersInformation: {},
    }
  },

  components: {
    MyHeader,
    Comment,
    Score,
    Subtitles,
  },

  mounted() {
    /* 获取当前页面显示所需要的数据 */
    if (this.$route.params.id) {
      this.docId = this.$route.params.id

      this
        .$http
        .get(`/players/${this.docId}`)
        .then((respones) => {
          const {
            data: {
              accounts,
              comments,
              doc: {
                accountId,
                action: actions,
                defaultAction,
                name,
                pictures,
                ratingStatis: {
                  star1,
                  star2,
                  star3,
                  star4,
                  star5,
                },
              },
            },
          } = respones

          /* 保存当前所有用户的个人信息 */
          this.usersInformation = accounts

          /* 获取当前文档的作者信息 */
          this.accountId = accountId
          this.teacherInformation = accounts.find((user) => user.id === this.accountId)

          /* 获取当前文档信息 */
          this.title = name

          /* 获取当前文档的评论和回复信息 */
          this.comments = comments
          this.comments.sort((prev, next) => Date.parse(next.createTime) - Date.parse(prev.createTime)).forEach((comment) => {
            const userInformation = accounts.find((user) => user.id === comment.accountId)
            comment.userName = userInformation.name || userInformation.nickname
            comment.avatar = userInformation.avatar
            comment.replies.sort((prev, next) => Date.parse(next.createTime) - Date.parse(prev.createTime)).forEach((reply) => {
              const replyUserInformation = accounts.find((user) => user.id === reply.accountId)
              const originUserInformation = accounts.find((user) => user.id === reply.sourceId)
              reply.userName = replyUserInformation.name || replyUserInformation.nickname
              reply.avatar = replyUserInformation.avatar
              reply.originUserName = originUserInformation.name || originUserInformation.nickname
              reply.originAvatar = originUserInformation.avatar
            })
          })

          /* 获取应当播放的 action */
          const action = actions.find((action) => action.id === defaultAction)

          /* 获取对应的字幕数据 */
          this.subtitles = action.subtitle

          this.pictures = pictures

          /* 计算当前文档的评分 */
          this.score = (star1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5) / (star1 + star2 + star3 + star4 + star5)
          this.score = window.isNaN(this.score) ? -1 : this.score

          /* 实例化播放器 */
          if (process.env.NODE_ENV === 'production') {
            this.player = new Player({
              actionUrl : action.json,
              audioUrl  : action.recording,
              duration  : action.duration,
              element   : document.getElementById('player'),
              imageUrls : this.pictures,
              mode      : 'mobile',
              size      : action.totalSize,
              subtitles : action.subtitle,
            })
          }

          /* 等到播放器完成初始化并确定了其尺寸的时候触发，用来给字幕组件设置上外边距，防止 */
          /* 处于固定定位的播放器遮盖底部的字幕组件正常显示 */
          this.handleOnSetSubtitleContainerMarginTop()

          /* 只有处于生产环境才执行微信 JS-SDK 的初始化操作，并需要在 axios 配置好了以后再执行 */
          if (process.env.NODE_ENV === 'production') {
            const title = this.title
            const coverURL = this.pictures[0]
            const authorName = this.teacherInformation.name || this.teacherInformation.nickname
            const authorIntroduction = this.teacherInformation.introduction

            /* 初始化微信 JS-SDK 配置 */
            initWeiXinShareConfig(window.encodeURIComponent(window.location.href))

            /* 等待微信 JS-SDK 可以使用后自定义分享相关的操作 */
            window.jWeixin.ready(function() {
              configWeiXinShare({
                title  : `${authorName}:《${title}》`,
                desc   : `${authorIntroduction}`,
                link   : window.location.href,
                imgUrl : coverURL,
              })
            })
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            throw error
          } else {
            alert('获取数据错误，请检查访问地址')
          }
        })
    }

    /* 获取当前登录用户的个人信息 */
    this
      .$http
      .get('/accounts')
      .then(({
        data: myInformation,
      }) => {
        this.myInformation = myInformation
      })
  },

  methods: {
    handleOnSubtitleChange(event) {
      this.activeSubtitleIndex = event.detail.subtitleIndex
    },

    handleOnSetSubtitleContainerMarginTop() {
      this.subtitleContainerMarginTop = this.$refs.playerWrapper.offsetHeight
    },

    handleOnAddCommentSuccess(comment) {
      comment.userName = this.myInformation.name || this.myInformation.nickname
      comment.avatar = this.myInformation.avatar

      this.comments.unshift(comment)
    },

    handleOnAddReplySuccess(comment) {
      this
        .comments
        .find((_comment) => _comment.id === comment.id)
        .replies
        .forEach((reply) => {
          /* 只更新补充没有用户信息的回复信息 */
          if (!reply.userName) {
            const replyUserInformation = this.usersInformation.find((user) => user.id === reply.accountId)
            const originUserInformation = this.usersInformation.find((user) => user.id === reply.sourceId)
            reply.userName = replyUserInformation.name || replyUserInformation.nickname
            reply.avatar = replyUserInformation.avatar
            reply.originUserName = originUserInformation.name || originUserInformation.nickname
            reply.originAvatar = originUserInformation.avatar
          }
        })
    },
  },
}

</script>

<style scoped>

.container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

#player {
  width: 100%;
  position: relative;
}

.selectToolBar {
  width: 100%;
  border: solid 1px #EEE;
  box-sizing: border-box;
}

.selectToolBar > a {
  padding-top: 10px;
  padding-bottom: 10px;
}

.selectToolBar > a:not(:first-child) {
  border-left: solid 1px #EEE;
}

</style>
