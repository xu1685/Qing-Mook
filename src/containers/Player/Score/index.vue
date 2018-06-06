<template>
  <div class='score'>
    <div class='left'>
      <span style='font-size: 16px; font-weight: 800; margin-right: 5px;'>
        评分:
      </span>
      <span style='font-size: 26px; font-weight: 800;'>
        {{score === -1 ? '暂无评分' : `${score}/5`}}
      </span>
    </div>
    <router-link
      class='right'
      v-if='accountId !== -1 && Object.keys(teacherInformation).length'
      :to='`/teacher/${accountId}`'
    >
      <img
        style='width: 30px; height: 30px; border-radius: 50%;'
        :src='teacherInformation.avatar'
      />
      <span style='color: #666; font-size: 20px;'>
        {{teacherInformation.name || teacherInformation.nickname}}
      </span>
      <i
        class='fa fa-angle-right'
        style='color: #666; font-size: 20px;'
      />
    </router-link>
  </div>
</template>

<script>

export default {
  name: 'Score',

  props: {
    accountId: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    teacherInformation: {
      type: Object,
      required: true,
    },
  },
}

</script>

<style scoped>

.score {
  height: 50px;
  padding: 0 10px;
  border-bottom: 1px solid #EEE;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.right > * {
  margin-left: 10px;
}

</style>
