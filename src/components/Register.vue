<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { register } from '@/api/user'
const store = useStore();
const router = useRouter();

// 定义表单数据
const registerForm = reactive({
    username: '',
    password: '',
    email: ''
});

// 提交注册
const submit = async () => {
    const response = await register({
        ...registerForm
    });
    await store.dispatch("token/login", registerForm);
    if (store.getters["token/isLoggedIn"]) {
        router.push("/home");
    }

};
</script>

<template>
    <div class="register-container">
        <el-form :model="registerForm" status-icon label-width="auto" @keyup.enter="submit">
            <el-form-item label="用户名">
                <el-input v-model="registerForm.username"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input type="password" v-model="registerForm.password"></el-input>
            </el-form-item>
            <el-form-item label="电子邮箱">
                <el-input type="email" v-model="registerForm.email"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button @click="submit">提交</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style scoped>
.register-container {
    width: 300px;
    margin: 100px auto;
}
</style>
