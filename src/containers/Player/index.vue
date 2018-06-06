<template>
  <div class='container'>
    <div
      :style='selected === "subtitles" ? {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "100",
      } : undefined'
    >
      <MyHeader :title='title' />
      <div
        id="player"
        @subtitlechange="handleOnSubtitleChange"
      />
      <mt-navbar
        class='selectToolBar'
        v-model='selected'
      >
        <mt-tab-item id='comment'>
          <span style='font-size: 16px;'>评论</span>
        </mt-tab-item>
        <mt-tab-item id='subtitles'>
          <span style='font-size: 16px;'>字幕</span>
        </mt-tab-item>
      </mt-navbar>
    </div>
    <mt-tab-container v-model='selected'>
      <mt-tab-container-item id='subtitles'>
        <Subtitles
          :activeSubtitleIndex='activeSubtitleIndex'
        />
      </mt-tab-container-item>
      <mt-tab-container-item id='comment'>
        <Score
          :teacherName='teacherName'
          :accountId='accountId'
          :score='score'
        />
        <Comment
          :docId='docId'
          :comments='comments'
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
      player: null,
      score: -1,
      selected: 'comment',
      teacherName: '',
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
          const teacherInformation = accounts.find((user) => user.id === this.accountId)
          this.teacherName = teacherInformation.name || teacherInformation.nickname

          /* 获取当前文档的评论和回复信息 */
          this.comments = comments

          /* 获取应当播放的 action */
          const action = actions.find((action) => action.id === defaultAction)

          /* 计算当前文档的评分 */
          this.score = (star1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5) / (star1 + star2 + star3 + star4 + star5)

          /* 实例化播放器 */
          // this.player = new Player({
          //   actionUrl : action.json,
          //   audioUrl  : action.recording,
          //   duration  : action.duration,
          //   element   : document.getElementById('player'),
          //   imageUrls : pictures,
          //   mode      : 'mobile',
          //   size      : action.totalSize,
          //   subtitles : action.subtitle,
          // })
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            throw error
          } else {
            alert('获取数据错误，请检查访问地址')
          }
        })
    }
  },

  methods: {
    handleOnSubtitleChange(subtitleIndex) {
      this.activeSubtitleIndex = subtitleIndex
    }
  },

  watch: {

  },
}

</script>

<style scoped>

.container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.player {
  width: 100%;
  position: relative;
}

.selectToolBar {
  width: 100%;
}

.selectToolBar > a:not(:first-child) {
  border-left: solid 1px #EEE;
}

</style>
