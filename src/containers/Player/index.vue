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
        <mt-tab-item id='comment'>
          <span
            style='font-size: 18px; color: #666; font-weight: 800;'
            :style='selected === "comment" ? { color: "#418642" } : undefined'
          >
            评论
          </span>
        </mt-tab-item>
        <mt-tab-item id='subtitles'>
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
          :comments.sync='comments'
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
import Comment from './Comment'
import Score from './Score'
import Subtitles from './Subtitles'
import Bus from '../../bus.js'
import Player from '../Player/Player/src/Player.js'

export default {
  name: 'Player',

  data() {
    return {
      accountId: -1,
      activeSubtitleIndex: -1,
      comments: [],
      docId: '',
      player: {},
      score: -1,
      selected: 'comment',
      subtitleContainerMarginTop: 0,
      subtitles: [],
      teacherInformation: {},
      title: '课程名称',
    }
  },

  components: {
    MyHeader,
    Comment,
    Score,
    Subtitles,
  },

  mounted() {
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

          /* 获取当前文档的作者信息 */
          this.accountId = accountId
          this.teacherInformation = accounts.find((user) => user.id === this.accountId)

          /* 获取当前文档信息 */
          this.title = name

          /* 获取当前文档的评论和回复信息 */
          this.comments = comments
          this.comments.forEach((comment) => {
            const userInformation = accounts.find((user) => user.id === comment.accountId)
            comment.userName = userInformation.name || userInformation.nickname
            comment.avatar = userInformation.avatar
            comment.replies.forEach((reply) => {
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

          /* 计算当前文档的评分 */
          this.score = (star1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5) / (star1 + star2 + star3 + star4 + star5)
          this.score = window.isNaN(this.score) ? -1 : this.score

          /* 实例化播放器 */
          this.player = new Player({
            actionUrl : action.json,
            audioUrl  : action.recording,
            duration  : action.duration,
            element   : document.getElementById('player'),
            imageUrls : pictures,
            mode      : 'mobile',
            size      : action.totalSize,
            subtitles : action.subtitle,
          })
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            throw error
          } else {
            alert('获取数据错误，请检查访问地址')
          }
        })
        .then(() => {
          this.handleOnSetSubtitleContainerMarginTop()
        })
    }
  },

  methods: {
    handleOnSubtitleChange(event) {
      this.activeSubtitleIndex = event.detail.subtitleIndex
    },

    handleOnSetSubtitleContainerMarginTop() {
      this.subtitleContainerMarginTop = this.$refs.playerWrapper.offsetHeight
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

.selectToolBar > a:not(:first-child) {
  border-left: solid 1px #EEE;
}

</style>
