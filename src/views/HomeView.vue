<script>
export default {
  data() {
    return {};
  },
  methods: {
    loginOut() {
      this.$store.dispatch("logout");
      this.$router.push('/login');
    },
  },
  beforeCreate() {
    this.$store.dispatch("initLoginState");
  },
};
</script>

<template>
  <div>
    <div>Welcome, {{ this.$store.state.username }}</div>
    <el-button type="primary" @click="loginOut">登出</el-button>
  </div>
</template>
