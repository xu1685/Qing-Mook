
<template>
    <div class="teacher">
        <MyHeader :pageName="title" :pagePath=" 'player/' + id " v-if="id != undefined"></MyHeader>
    <div style="height: 200px;">
     
      <!-- 内容：头像 信息 -->
        <div class="message">
            <mt-swipe class="mySwipe" :auto="0" :continuous="false">
                  <mt-swipe-item>
                      <img src="./teacher.jpeg" class="photo">
                    <h3 style="color:#FFFFFF">蜗牛老师</h3>
                    <h5 style="color:#c7c7c7">web前端工程师</h5>
                  </mt-swipe-item>
                  <mt-swipe-item>
                      <h4 style="color: rgb(232, 232, 232)">这是一段介绍</h4>
                      <p style="color: rgb(232, 232, 232);padding-top: 15px;">
                          《Sass与Compass实战》共分为10章，旨在完整介绍两个工具：Sass和Compass，从而引领读者通过框架高效地构建样式表，创建动态页面。
                    </p>
                  </mt-swipe-item>
                </mt-swipe>    
      </div>
      <!-- 黑色透明遮罩 -->
      <div class="black"></div>
      <img src='./teacher.jpeg' onerror="this.style.display='none'" width="100%" height="200px;">
    <!-- 课程卡片 -->
    </div>
    <div class="course">
        <div>
            <span style="font-size: 18px;color: #3e3e3e;font-weight: 550;margin-top: 10px;display: block">所有课堂</span>
        </div>
        <div class="coursesCell" v-for="(course,index) in libraries">
          <router-link :to=" '/course/' + index " class="link">
            <div class="imgcontainer">
              <img class="image" :src="course.cover" width="50px" height="50px" >
            </div>
            <span class="courseName">{{course.name}}</span>
          </router-link>
        </div>
    </div>
    </div>
</template>

<script>
    import MyHeader from '../header/Header.vue'
    import { Swipe, SwipeItem } from 'mint-ui';
    export default {
        name: 'Teacher',
        data(){
            return {
        id: this.$route.params.id,
        libraries:[],
        title:'教师主页'
            }
        },
        created(){
            // console.log(this.$route.params.id);
      this.pageInite();
        },
    methods:{
      pageInite(){
        this.$http.get('/accounts/docs')
          .then((res) => {
            this.libraries = res.data.libraries;
            console.log(this.libraries,'lib')
         })
      }
    },
        components:{
            MyHeader,
            'mt-swipe': Swipe,
            'mt-swipe-item': SwipeItem
        }
    }
</script>

<style>
    .teacher{
        margin-top: 40px;
    }
   .black{
    width: 100%;
    height: 200px;
    position: absolute;
    background-color:rgba(0, 0, 0, 0.48);
   /* -webkit-filter: blur(10px);
    -moz-filter: blur(10px);
    -o-filter: blur(10px);
    -ms-filter: blur(10px);
    filter: blur(10px);*/
    z-index: 1;
  }
   .message{
    width: 100%;
    height: 200px;
    position: absolute;
    top: 40px;
    z-index: 3;
  }

  .photo{
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 1px solid lightgray;
      margin-top: 10px;
  }
  .mySwipe{
      width: 100%;
      height: 200px;
  }
  .course{
    margin:0 10px;
  }
    .coursesCell{
    text-align: left;
    margin: 5px 0;
    padding: 5px;
    background-color: rgba(212, 212, 212, 0.24);
    border-radius: 3px;
  }
  .link{
    display: flex;
    align-items: center;
  }
  .imgcontainer{
    display: inline-block;
    width: 48px;
    height: 48px;
    overflow: hidden;
    margin: 10px;
  }
  .image{
    display: inline-block;
    background-position: 0px 1px;
    margin: -1px;
  }
  .courseName{
    font-size: 19px;
    margin-left: 10px;
    color: black;
    
  }
</style>
