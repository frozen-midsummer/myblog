<template>
  <div class="login-container">
    <el-form :model="loginForm" status-icon ref="loginForm" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="loginForm.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
      },
    };
  },
  methods: {
    handleLogin() {
      // 假设这是从表单获取的用户名和密码
      const { username, password } = this.loginForm;
      // 调用Vuex的action进行登录
      this.$store
        .dispatch("login", { username, password })
        .then(() => {
          // 登录成功后的处理，比如跳转页面
          if (this.$store.getters.isLoggedIn) {
            this.$router.push("/home");
          }
        })
        .catch((error) => {
          console.error("登录失败:", error.message);
          // 显示错误信息
          this.$message.error("登录失败，请重试");
        });
    },
  },
  mounted() {
    // 页面加载时初始化登录状态
    this.$store.dispatch("initLoginState");
  },
};
</script>

<style scoped>
.login-container {
  width: 300px;
  margin: 100px auto;
}
</style>
