<template>
  <div class='container'>
    <MyHeader :pageName='title' />
    <div class='information'>
      <div class='message'>
        <mt-swipe class='mySwipe' :auto='0' :continuous='false'>
          <mt-swipe-item>
            <img src='./teacher.jpeg' class='photo'>
            <h3 style='color:#FFFFFF'>蜗牛老师</h3>
            <h5 style='color:#c7c7c7'>web前端工程师</h5>
          </mt-swipe-item>
          <mt-swipe-item>
            <h4 style='color: rgb(232, 232, 232)'>这是一段介绍</h4>
            <p style='color: rgb(232, 232, 232);padding-top: 15px;'>
              《Sass与Compass实战》共分为10章，旨在完整介绍两个工具：Sass和Compass，从而引领读者通过框架高效地构建样式表，创建动态页面。
            </p>
          </mt-swipe-item>
        </mt-swipe>
      </div>
      <img class='backgroundImage' src='./teacher.jpeg'>
    </div>
    <div class='courseList'>
      <div class='coursesCell' v-for='library in libraries'>
        <router-link :to='"/course/" + library.id' class='link'>
          <div class='imgcontainer'>
           <div class='image'>
             <img class='image' :src='library.cover' onerror='this.style.display="none"'>
           </div>
          </div>
          <div class='msgcontainer'>
            <span class='courseName'>{{library.name}}</span>
            <p class='alt'>{{library.docs.length}}个文档</p>
          </div>
        </router-link>
        <hr class='hr1'>
      </div>
    </div>
  </div>
</template>

<script>

import MyHeader from '../MyHeader'
import { Indicator } from 'mint-ui'
import { Toast } from 'mint-ui'

export default {
  name: 'Teacher',

  data() {
    return {
      id: this.$route.params.id,
      libraries: [],
      title: '教师主页',
    }
  },

  created() {
    this.pageInite()
  },

  methods: {
    pageInite() {
      Indicator.open()
      this.$http.get('/accounts/docs')
        .then((res) => {
          this.libraries = res.data.libraries
          Indicator.close()
        })
    },

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

.mySwipe {
  width: 100%;
  height: 200px;
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
}

.alt {
  color: gray;
  font-size: 15px;
  margin-top: 8px;
}

.hr1 {
  height:1px;
  border:none;
  border-top:1px solid lightgray;
  margin-top: 10px;
  margin: 10px 10px 0 10px;
}

</style>
