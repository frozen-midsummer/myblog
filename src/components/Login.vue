<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

const store = useStore();
const router = useRouter();

// 定义表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 登录处理函数
const handleLogin = async () => {
  try {
    await store.dispatch("token/login", loginForm);

    if (store.getters["token/isLoggedIn"]) {
      router.push("/home");
    }
  } catch (error) {
    console.error("登录失败:", error.message);
    ElMessage.error("登录失败，请重试");
  }
};

const handleRegister = async () => {
  router.push("/register");
};

// 页面加载时初始化登录状态
onMounted(() => {
  store.dispatch("token/initLoginState");
});
</script>

<template>
  <div class="login-container">
    <el-form :model="loginForm" status-icon label-width="auto" @keyup.enter="handleLogin">
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="loginForm.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleLogin">登录</el-button>
        <el-button @click="handleRegister">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.login-container {
  width: 300px;
  margin: 100px auto;
}
</style>
