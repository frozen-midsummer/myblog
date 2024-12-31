<script setup>
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
const store = useStore();
const router = useRouter();
function loginOut() {
  store.dispatch("token/logout");
  router.push('/login');
}
</script>

<template>
  <div>
    <div>Welcome, {{ store.getters["token/username"] }}</div>
    <el-button @click="loginOut">登出</el-button>
  </div>
</template>
