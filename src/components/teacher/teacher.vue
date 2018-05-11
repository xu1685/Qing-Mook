
<template>
    <div class="teacher">
        <MyHeader :pageName="title" pagePath="00"></MyHeader>
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
    <hr class="hr1">
    <div class="course">
        <div class="coursesCell" v-for="(course,index) in libraries">
          <!-- <div class="no" v-if="!course.isDefault" @click="pop"></div> -->
          <router-link :to=" '/course/' + index " class="link">
            <div class="imgcontainer">
             <div class="image">
               <img class="image" :src="course.cover" onerror="this.style.display='none'">
             </div>
              
            </div>
            <div class="msgcontainer">
              <span class="courseName">{{course.name}}</span>
              <p class="alt">{{course.docs.length}}个文档</p>
            </div>
            
          </router-link>
          <hr class="hr1">
        </div>
    </div>
    </div>
</template>

<script>
  import MyHeader from '../header/Header.vue'
  import { Swipe, SwipeItem } from 'mint-ui';
  import { Indicator } from 'mint-ui';
  import { Toast } from 'mint-ui';
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
      Indicator.open();
      this.$http.get('/accounts/docs')
        .then((res) => {
          this.libraries = res.data.libraries;
          console.log(this.libraries,'lib');
          Indicator.close();

       })
    },
    pop(){
      Toast({
        message: '该课程已关闭',
        iconClass: 'icon',
        position: 'bottom'
      });
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
  .coursesCell{
    width: 100%;
    /*background-color: rgba(212, 212, 212, 0.24);*/
    height: 100px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  .link{
    display: flex;
    align-items: center;
    height: 100px;
    text-align: left;
  }
  .noclick{
    pointer-events: none;
  }
  .imgcontainer{
    display: inline-block;
    width: 150px;
    height: 100px;
    margin: 10px;
    border-radius: 5px;
    background: gray;
  }
 /* .msg{
    position: absolute;
    width: 148px;
    height:20px; 
    margin-top: 78px;
    color: white;
    border-radius: 5px;
    background: -moz-linear-gradient(bottom, #0c0c0c4f 0%, #fff0 100%);
    background: -webkit-gradient(linear, left bottom, left top, color-stop(0%,#0c0c0c4f), color-stop(100%,#fff0));
    background: -webkit-linear-gradient(bottom, #0c0c0c4f 0%,#fff0 100%);
    background: -o-linear-gradient(bottom, #0c0c0c4f 0%,#fff0 100%);
    background: -ms-linear-gradient(bottom, #0c0c0c4f 0%,#fff0 100%);
    background: linear-gradient(to top, #0c0c0c4f 0%,#fff0 100%);
  }*/
  .image{
    display: inline-block;
    background-position: 0px 1px;
    width:150px;
    height:100px;
    border-radius: 5px;
  }
  .msgcontainer{
    height: 100px;
    margin-left: 8px;
  }
  .courseName{
    display: inline-block;
    width: 180px;
    text-overflow: ellipsis;
    overflow:hidden;
    white-space: nowrap;
    font-size: 20px;
    color: black;
  }
  .alt{
    color: gray;
    font-size: 15px;
    margin-top: 48px;
  }
.hr1{
  height:1px;
  border:none;
  border-top:1px solid lightgray;
  margin-top: 10px;
  margin: 10px 10px 0 10px;
} 
</style>
