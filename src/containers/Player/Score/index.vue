<template>
  <div class='score'>
    <div class='left'>
      <span style='font-size: 16px; font-weight: 800; margin-right: 5px;'>评分:</span>
      <span style='font-size: 26px; font-weight: 800;'>{{score === -1 ? '暂无评分' : score}}</span>
    </div>
    <!-- 跳转到教师页面 -->
    <router-link
      class='right'
      v-if='accountId !== -1'
      :to='`/teacher/${accountId}`'
    >
      <img src='./logo.png' style='width: 30px; height: 30px; margin-right: 5px;'>
      <span>{{teacherName}}</span>
      <i
        class='fa fa-angle-right'
        style='margin-left: 10px; color: gray;'
      />
    </router-link>
  </div>
</template>

<script>

export default {
  name: 'Score',

  props: {
    teacherName: {
      type: String,
      required: true,
    },
    accountId: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
}

</script>

<style scoped>

.score {
  height: 50px;
  padding: 0 10px;
  border-bottom: 1px solid lightgray;
  border-top: 1px solid lightgray;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right {
  display: flex;
  align-items: center;
  text-decoration: none;
}

</style>
