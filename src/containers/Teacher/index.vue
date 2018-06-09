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
          :to='`/course/${library.id}`'
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
            <p class='alt'>{{library.docs.length}}个文档</p>
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

export default {
  name: 'Teacher',

  data() {
    return {
      accountId: this.$route.params.id,
      libraries: [],
      teacherInformation: {},
    }
  },

  created() {
    Indicator.open('获取用户数据中')

    /* 获取用户数据，显示用户当前所拥有的的课堂 */
    Promise
      .all([
        this.$http.get('/accounts'),
        this.$http.get('/accounts/docs'),
      ])
      .then(([{
        data: teacherInformation,
      }, {
        data: {
          coopLibraries,
          libraries,
        },
      }]) => {
        this.teacherInformation = teacherInformation
        this.libraries = libraries.concat(coopLibraries)

        Indicator.close()
      })
      .catch((error) => {
        throw error

        Indicator.close()
      })
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
  text-decoration: none;
}

.alt {
  color: gray;
  font-size: 15px;
  margin-top: 8px;
}

</style>
