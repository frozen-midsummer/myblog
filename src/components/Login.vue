<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const store = useStore();
const router = useRouter();
const route = useRoute();

const loginFormRef = ref(null);
const loading = ref(false);

// 定义表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
};

// 登录处理函数
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await store.dispatch("token/login", loginForm);

        if (store.getters["token/isLoggedIn"]) {
          ElMessage.success("登录成功");
          const redirect = route.query.redirect || '/home';
          router.push(redirect);
        }
      } catch (error) {
        console.error("登录失败:", error);
        // Error handling is mostly done in request.js, but fallback here
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleRegister = () => {
  router.push("/register");
};

// 页面加载时初始化登录状态
onMounted(() => {
  store.dispatch("token/initLoginState");
  if (store.getters["token/isLoggedIn"]) {
     router.push('/home');
  }
});
</script>

<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-header">
        <h2>欢迎回来</h2>
        <p>请登录您的 MyBlog 账号</p>
      </div>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="rules"
        status-icon 
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            type="password" 
            v-model="loginForm.password" 
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading" 
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="form-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="handleRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color-mute);
  background-image: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background-color: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
      margin: 0 0 10px;
      color: var(--text-color);
    }
    
    p {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }
  
  .form-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
