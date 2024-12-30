<script setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
const store = useStore();
const router = useRouter();
function loginOut() {
  store.dispatch("theme/logout");
  router.push('/login');
}
</script>

<template>
  <div>
    <div>Welcome, {{ store.getters["theme/username"] }}</div>
    <el-button type="primary" @click="loginOut">登出</el-button>
  </div>
</template>
