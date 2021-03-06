<template>
  <div class='coursePage'>
    <MyHeader title='【课程专辑】' />
    <div class='container'>
      <div class='message'>
        <h2 class='coursetitle'>{{library.name}}</h2>
        <div
          class='blackMask'
          :style='{
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundImage: library.isDefault ? `url(${defaultClassCoverPng})` : (library.cover || defaultClassCoverPng)
          }'
        />
      </div>
      <hr class='hr1'>
      <div class='courseCell' v-for='course in courseList' :key='course.id'>
        <router-link
          class='link'
          :to='{ path: "/player/" + course.id  }'
        >
          <div class='imgcon'>
            <div class='msg'>
              <i
                class='fa fa-star'
                style='
                  font-size: 20px;
                  color: #fbe359;
                  width: 110px;
                  margin-top: 20px;
                '
                v-if='computeScore(course.ratingStatis) !== -1'
              >
                {{computeScore(course.ratingStatis)}}
              </i>
              <span
                style='
                  font-size: 20px;
                  color: white;
                  width: 110px;
                  margin-top: 20px;
                  display: inline-block;
                '
                v-if='computeScore(course.ratingStatis) === -1'
              >
                暂无评分
              </span>
            </div>
            <div class='blackblock'></div>
            <div class='classImg'>
              <img class='classImg' :src='course.cover' >
            </div>
          </div>
          <div class='msgcontainer'>
            <div style='display: inline-block;'>
              <span class='className'>{{course.name}}</span>
            </div>
            <div class='icons'>
              <i  class='fa fa-caret-square-o-right' />
              <span style='display: inline-block;margin-left: 5px;'>{{course.view}}</span>
              <i style='margin-left: 15px;' class='fa fa-commenting-o' />
              <span style='display: inline-block;margin-left: 5px;'>{{course.commentNums}}</span>
            </div>
          </div>
        </router-link>
        <hr class='hr1'>
      </div>
    </div>
  </div>
</template>

<script>

import { Indicator } from 'mint-ui'
import MyHeader from '../MyHeader'
import defaultClassCoverPng from '../../assets/defaultClassCover.png'
import {
  configWeiXinShare,
  initWeiXinShareConfig,
} from '../../utils/weixin'

export default {
  name: 'course',

  data() {
    return {
      accountId: this.$route.query.accountId,
      action: [],
      allDcos: [],
      courseList: [],
      cover: '',
      defaultClassCoverPng,
      docs: [],
      library: {},
      libraryId: this.$route.params.id,
      name: '课堂主页',
      teacherInformation: {},
      title: '课程列表',
    }
  },

  mounted() {
    Indicator.open('获取课堂数据中')

    this
      .$http
      .get(`/players/accounts/${this.accountId}`)
      .then(({
        data: {
          accounts,
          coopDocs,
          coopLibraries,
          docs,
          libraries,
        },
      }) => {
        const allLibraries = libraries.concat(coopLibraries)
        const allDocs = docs.concat(coopDocs)

        this.library = allLibraries.find((library) => library.id === this.libraryId)

        this.teacherInformation = accounts.find((user) => String(user.id) === this.accountId)

        this.library.chapters.reduce((result, chapter) => {
          return result.concat(chapter.docs)
        }, this.library.docs).forEach((docId) => {
          const doc = allDocs.find((_doc) => _doc.id === docId)
          if (
            doc &&
            doc.status == 'open' &&
            doc.transformed == '1' &&
            doc.hasAction
          ) {
            this.courseList.push(doc)
          }
        })

        Indicator.close()

        /* 只有处于生产环境才执行微信 JS-SDK 的初始化操作 */
        if (process.env.NODE_ENV === 'production') {
          const title = this.library.name
          const coverURL = this.library.cover
          const authorName = this.teacherInformation.name || this.teacherInformation.nickname
          const authorIntroduction = this.teacherInformation.introduction

          /* 初始化微信 JS-SDK 配置 */
          initWeiXinShareConfig(window.encodeURIComponent(window.location.href))

          /* 等待微信 JS-SDK 可以使用后自定义分享相关的操作 */
          window.jWeixin.ready(function() {
            configWeiXinShare({
              title  : `${authorName}:《${title}》专辑`,
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
  },

  methods: {
    computeScore({
      star1,
      star2,
      star3,
      star4,
      star5,
    }) {
      /* 计算当前文档的评分 */
      const score = (star1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5) / (star1 + star2 + star3 + star4 + star5)
      return window.isNaN(score) ? -1 : score
    },
  },

  components: {
    MyHeader,
  },
}

</script>

<style scoped>

.coursePage {
  width: 100%;
}

.blackMask {
  width: 100%;
  height: 200px;
  position: absolute;
  z-index: -1;
}

.message {
  background-color:rgba(0, 0, 0, 0.48);
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.coursetitle {
  color: white;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 60%;
}

 .courseCell {
  width: 100%;
  height: 65px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.link {
  display: flex;
  align-items: center;
  height: 65px;
  text-decoration: none;
}

.imgcon {
  display: inline-block;
  width: 110px;
  height: 65px;
  margin: 10px;
  border-radius: 5px;
  background: gray;
  z-index: 1;
}

.classImg {
  display: inline-block;
  width:110px;
  height:65px;
  z-index: 1;
  border-radius: 5px;
}

.msg {
  position: absolute;
  width: 110px;
  height: 65px;
  border-radius: 5px;
  text-align: center;
  z-index: 3;
  vertical-align: middle;
}

.blackblock {
  display: inline-block;
  position: absolute;
  width: 110px;
  height: 65px;
  background-color: rgba(0, 0, 0, 0.28);
  z-index: 2;
  border-radius: 5px;
}

.msgcontainer {
  height: 65px;
  margin-left: 8px;
  margin-right: 10px;
  flex:1;
  text-align: left;
}

.className {
  display: inline-block;
  width: 160px;
  text-overflow: ellipsis;
  overflow:hidden;
  white-space: nowrap;
  font-size: 18px;
  color: black;
  text-align:left;
}

.icons {
  text-align:left;
  color: gray;
  margin-top: 18px;
  width: 100%;
}

.hr1 {
  height:1px;
  border:none;
  border-top:1px solid lightgray;
  margin-top: 10px;
  margin: 10px 10px 0 10px;
}

</style>
