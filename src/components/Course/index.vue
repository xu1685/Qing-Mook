<template>
  <div class="coursePage">
    <MyHeader :pageName="name" />
    <div class="container">
      <div style="height: 200px;">
        <div class="message">
          <h2 class="coursetitle">{{this.library.name}}</h2>
          <span style="color: rgb(199, 199, 199)">共{{this.courseList.length}}个可读文档</span>
          <!-- <p style="margin-top: 20px;color: rgb(199, 199, 199)">{{this.createTime}}</p> -->
        </div>
        <!-- 黑色透明遮罩 -->
        <div class="black"></div>
        <img :src="this.library.cover" onerror="this.style.display='none'" width="100%" height="200px;">
        <!-- 内容：头像 信息 -->

      <!-- 课程卡片 -->
      </div>
      <hr class="hr1">
      <div class="courseCell" @click="sendIndex" v-for="(course,index) in courseList" :key="index">
        <router-link :to="{ path: '/player/'+ course.id  }"  class="link">
          <div class="imgcon">
            <div class="msg">
              <i style="color:white;font-size: 20px;width: 110px;text-align: center;margin-top: 20px;color:#fbe359" class="fa fa-star" aria-hidden="true" v-if="score(course.ratingStatis) !== '暂无评分' ">{{score(course.ratingStatis)}}</i>
              <i style="color:white;font-size: 20px;width: 110px;text-align: center;margin-top: 20px;" class="fa" aria-hidden="true" v-if="score(course.ratingStatis) == '暂无评分' ">{{score(course.ratingStatis)}}</i>
            </div>
            <div class="blackblock"></div>
            <div class="classImg">
              <img class="classImg" :src="course.cover" onerror="this.style.display='none'" >
            </div>

          </div>
          <div class="msgcontainer">
            <div style="display: inline-block;">
              <span class="className">{{course.name}}</span>
            </div>
            <div class="icons">
              <i  class="fa fa-caret-square-o-right" aria-hidden="true"></i>
              <span style="display: inline-block;margin-left: 5px;">{{course.view}}</span>
              <i style="margin-left: 15px;" class="fa fa-commenting-o" aria-hidden="true"></i>
              <span style="display: inline-block;margin-left: 5px;">{{course.commentNums}}</span>

            </div>
          </div>
        </router-link>
        <hr class="hr1">
      </div>
    </div>
  </div>
</template>

<script>

import MyHeader from '../Header'
import Bus from '../../bus.js'
import { Indicator } from 'mint-ui'

export default {
  name: 'course',

  data() {
    return {
      title: '课程列表',
      courseList: [],
      libraryId: this.$route.params.id,
      docs: [],
      allDcos: [],
      library: {},
      cover: '',
      createTime: '',
      action: [],
      name: '课堂主页',
    }
  },

  created() {
    this.pageInite()
  },

  mounted() {

  },

  methods: {
    pageInite() {
      Indicator.open()
      this.$http.get('/accounts/docs')
        .then((res) => {
          this.allDcos = res.data.docs
          this.library = res.data.libraries.find(library => library.id === this.libraryId)
          this.createTime = this.library.createTime.replace('T', ' ').replace(/\.\w+/, '')
          this.docs = this.library.docs
          const len = this.allDcos.length
          for (let i = 0; i < len; i++) {
            if (this.docs.indexOf(this.allDcos[i].id) != -1 && this.allDcos[i].status == 'open' && this.allDcos[i].transformed == '1' && this.allDcos[i].hasAction) {
              this.courseList.push(this.allDcos[i])
            }
          }
          this.courseList = this.courseList.reverse()
          Indicator.close()
        })
    },

    sendIndex() {
      Bus.$emit('index', this.index)
    },

    score(obj) {
      const arr = Object.values(obj)
      const len = arr.length
      let count = 0
      for (let i = 0; i < len; i++) {
        count += arr[i]
      }
      if (count === 0) {
        var score = '暂无评分'
      } else {
        var score = (arr[0] * 1 + arr[1] * 2 + arr[2] * 3 + arr[3] * 4 + arr[4] * 5) / count
        score = score.toFixed(1)
      }
      return score
    },
  },

  components: {
    MyHeader,
  },
}

</script>

<style scoped>

.coursePage {

}

.black {
  width: 100%;
  height: 200px;
  position: absolute;
  background-color:rgba(0, 0, 0, 0.48);
  z-index: 1;
}

.message {
  width: 100%;
  height: 200px;
  position: absolute;
  top: 40px;
  z-index: 3;
  text-align: center
}

.coursetitle {
  margin-top: 40px;
  color: white;
  text-overflow: ellipsis;
  overflow:hidden;
  white-space: nowrap;
  width: 60%;
  margin-left: 20%;
}

 .courseCell {
  width: 100%;
  /*background-color: rgba(212, 212, 212, 0.24);*/
  height: 65px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.link {
  display: flex;
  align-items: center;
  height: 65px;
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
  color: white;
  border-radius: 5px;
  text-align: left;
  z-index: 3;
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
