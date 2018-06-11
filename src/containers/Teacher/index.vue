<template>
  <div class='container'>
    <MyHeader title='用户个人主页' />
    <div class='information'>
      <div class='message'>
        <div>
          <img class='photo' :src='teacherInformation.avatar' />
          <h3 style='color:#FFFFFF;'>{{teacherInformation.name || teacherInformation.nickname}}</h3>
          <h5 style='color:#C7C7C7;'>{{teacherInformation.introduction}}</h5>
        </div>
      </div>
      <img class='backgroundImage' :src='teacherInformation.avatar' />
    </div>
    <div class='courseList'>
      <div
        class='coursesCell'
        v-for='library in libraries'
      >
        <router-link
          class='link'
          :to='`/course/${library.id}?accountId=${accountId}`'
        >
          <div class='imgcontainer'>
            <div class='image'>
              <img
                class='image'
                :src='library.cover'
              />
            </div>
          </div>
          <div class='msgcontainer'>
            <span class='courseName'>{{library.name}}</span>
            <p class='alt'>{{documentNumberForEachLibrary[library.id]}}个文档</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>

import MyHeader from '../MyHeader'
import { Indicator } from 'mint-ui'
import { Toast } from 'mint-ui'
import {
  configWeiXinShare,
  initWeiXinShareConfig,
} from '../../utils/weixin'

export default {
  name: 'Teacher',

  data() {
    return {
      accountId: this.$route.params.id,
      documentNumberForEachLibrary: {},
      libraries: [],
      teacherInformation: {},
    }
  },

  mounted() {
    Indicator.open('获取用户数据中')

    /* 获取用户数据，显示用户当前所拥有的的课堂 */
    this
      .$http
      .get(`/players/accounts/${this.accountId}`)
      .then(({
        data: {
          accounts,
          coopLibraries,
          libraries,
        },
      }) => {
        this.teacherInformation = accounts.find((user) => String(user.id) === this.accountId)
        this.libraries = libraries.concat(coopLibraries)

        Indicator.close()

        /* 只有处于生产环境才执行微信 JS-SDK 的初始化操作 */
        if (process.env.NODE_ENV === 'production') {
          const coverURL = this.teacherInformation.avatar
          const authorName = this.teacherInformation.name || this.teacherInformation.nickname
          const authorIntroduction = this.teacherInformation.introduction

          /* 初始化微信 JS-SDK 配置 */
          initWeiXinShareConfig(window.encodeURIComponent(window.location.href))

          /* 等待微信 JS-SDK 可以使用后自定义分享相关的操作 */
          window.jWeixin.ready(function() {
            configWeiXinShare({
              title  : `${authorName}的个人主页`,
              desc   : `个人简介:${authorIntroduction}`,
              link   : window.location.href,
              imgUrl : coverURL,
            })
          })
        }
      })
      .catch((error) => {
        throw error

        Indicator.close('获取用户数据失败，请稍后重试')
      })
  },

  watch: {
    libraries() {
      this.libraries.forEach((library) => {
        this.documentNumberForEachLibrary[library.id] = library.docs.length + library.chapters.reduce((result, chapter) => {
          return result + chapter.docs.length
        }, 0)
      })
    },
  },

  methods: {
    pop() {
      Toast({
        message: '该课程已关闭',
        iconClass: 'icon',
        position: 'bottom',
      })
    },
  },

  components: {
    MyHeader,
  },
}

</script>

<style scoped>

.container {
  width: 100%;
}

.information {
  width: 100%;
  height: 200px;
  position: relative;
}

.message {
  width: 100%;
  height: 100%;
  background-color:rgba(0, 0, 0, 0.48);
  text-align: center;
}

.backgroundImage {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.courseList {

}

.photo {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 1px solid lightgray;
  margin-top: 10px;
}

.coursesCell {
  width: 100%;
  height: 80px;
  padding: 10px;
  box-sizing: border-box;
}

.link {
  display: flex;
  align-items: center;
  height: 100%;
  padding-bottom: 10px;
  border-bottom: solid 1px #DDD;
  text-decoration: none;
}

.noclick {
  pointer-events: none;
}

.imgcontainer {
  width: 110px;
  height: 100%;
  border-radius: 5px;
  background: gray;
}

.image {
  display: inline-block;
  width: 110px;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
}

.msgcontainer {
  height: 100%;
  margin-left: 10px;
}

.courseName {
  display: inline-block;
  width: 180px;
  text-overflow: ellipsis;
  overflow:hidden;
  white-space: nowrap;
  font-size: 20px;
  color: black;
  text-decoration: none;
}

.alt {
  color: gray;
  font-size: 15px;
  margin-top: 8px;
}

</style>
