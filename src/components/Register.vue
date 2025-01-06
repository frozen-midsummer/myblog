<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { register } from '@/api/user'
import ChinaCityCodeCascader from '@/components/ChinaCityCodeCascader.vue';
const store = useStore();
const router = useRouter();
// 定义表单数据
const registerForm = reactive({
    username: '',
    password: '',
    sex: '',
    birthday: '',
    location: '',
    skills: '',
    feelings: '',
    description: '',
});
// 保存表单初始状态的一个快照
const initialFormState = { ...registerForm };
//性别选项
const sexOptions = ref([
    {
        value: 'M',
        label: '男'
    },
    {
        value: 'F',
        label: '女'
    },
    {
        value: 'O',
        label: '其他'
    },
])
const handleCitySelect = (cityCode, pathLabels) => {
    registerForm.location = pathLabels.join()
}
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
// 清空表单
const cancel = () => {
    // 将表单恢复到初始状态
    Object.keys(initialFormState).forEach(key => {
        registerForm[key] = initialFormState[key];
    });
};
</script>

<template>
    <div class="register-container">
        <el-form :inline="true" :model="registerForm" status-icon label-width="auto" @keyup.enter="submit">
            <el-form-item label="用户名">
                <el-input v-model="registerForm.username"></el-input>
            </el-form-item>
            <el-form-item label="密码">
                <el-input type="password" v-model="registerForm.password"></el-input>
            </el-form-item>
            <el-form-item label="性别">
                <el-select v-model="registerForm.sex" placeholder="♂, ♀, ...">
                    <el-option v-for="item in sexOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="生日">
                <el-date-picker v-model="registerForm.birthday" type="date" :size="size" />
            </el-form-item>
            <el-form-item label="地点">
                <china-city-code-cascader @on-changed="handleCitySelect"></china-city-code-cascader>
            </el-form-item>
            <el-form-item label="</>">
                <el-input v-model="registerForm.skills"></el-input>
            </el-form-item>
            <el-form-item label="个人简介">
                <el-input v-model="registerForm.description" type="textarea"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button @click="submit">提交</el-button>
                <el-button @click="cancel">取消</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<style scoped>
.register-container {
    width: 55vw;
    margin: auto
}

.register-container .el-form-item {
    width: 20vw
}

.register-container .el-form>.el-form-item:nth-child(7) {
    width: 42vw;
}
</style>
