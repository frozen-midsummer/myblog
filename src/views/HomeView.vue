<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex';
import { getByUsername, modify } from '@/api/user';
import ChinaCityCodeCascader from '@/components/ChinaCityCodeCascader.vue';
import { ElMessage } from "element-plus";
import { User, Calendar, Location, MagicStick, ChatDotRound, Edit } from '@element-plus/icons-vue';

const store = useStore();
const activeName = ref("baseInfo")
const loading = ref(false);

const sexOptions = [
  { value: 'M', label: '男' },
  { value: 'F', label: '女' },
  { value: 'O', label: '其他' },
];

const form = reactive({
  id: '',
  username: '',
  sex: '',
  birthday: '',
  location: '',
  skills: '',
  feelings: '',
  description: '',
})

// 用于重置的数据备份
let initialData = {};

onMounted(async () => {
  await fetchData();
})

async function fetchData() {
  loading.value = true;
  try {
    const username = store.getters["token/username"];
    if (!username) return;
    
    const response = await getByUsername({ username });
    if (response && response.result) {
      Object.assign(form, response.result);
      // 保存初始数据用于重置
      initialData = JSON.parse(JSON.stringify(response.result));
    }
  } catch (error) {
    console.error("Failed to fetch user info:", error);
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  if (!form.username || form.username.trim().length < 3) {
    ElMessage.warning("用户名长度不能少于 3 个字符");
    return;
  }
  
  loading.value = true;
  try {
    const isUsernameChanged = form.username !== initialData.username;
    const response = await modify(form)
    if (response && response.result) {
      const newUserInfo = response.result;
      Object.assign(form, newUserInfo);
      initialData = JSON.parse(JSON.stringify(newUserInfo));
      
      // 如果修改了用户名，需要更新 store 和 localStorage 中的信息
      if (isUsernameChanged) {
        store.commit("token/SET_USERNAME", newUserInfo.username);
        localStorage.setItem("username", newUserInfo.username);
        
        // 如果返回了新 token，更新它
        if (newUserInfo.token) {
          store.commit("token/SET_TOKEN", newUserInfo.token);
          localStorage.setItem("token", newUserInfo.token);
        }
      }
      
      ElMessage.success("个人信息修改成功")
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  if (initialData.username) {
    Object.assign(form, initialData);
    ElMessage.info("已重置为上次保存的状态");
  } else {
    // 如果没有初始数据，清空非只读字段
    form.sex = '';
    form.birthday = '';
    form.location = '';
    form.skills = '';
    form.feelings = '';
    form.description = '';
  }
}

const handleCitySelect = (cityCode, pathLabels) => {
  form.location = pathLabels.join('/')
}
</script>

<template>
  <div class="home-container" v-loading="loading">
    <el-row :gutter="20">
      <!-- 左侧个人简介卡片 -->
      <el-col :xs="24" :sm="8" :md="6">
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="100" class="profile-avatar">
              {{ form.username ? form.username.charAt(0).toUpperCase() : 'U' }}
            </el-avatar>
            <h2 class="username">{{ form.username || '未登录' }}</h2>
            <p class="description">{{ form.description || '这个人很懒，什么都没有写...' }}</p>
          </div>
          <div class="profile-details">
            <div class="detail-item" v-if="form.location">
              <el-icon><Location /></el-icon>
              <span>{{ form.location }}</span>
            </div>
            <div class="detail-item" v-if="form.birthday">
              <el-icon><Calendar /></el-icon>
              <span>{{ form.birthday }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧编辑表单 -->
      <el-col :xs="24" :sm="16" :md="18">
        <el-card class="edit-card">
          <template #header>
            <div class="card-header">
              <span>个人资料设置</span>
            </div>
          </template>
          
          <el-tabs v-model="activeName">
            <el-tab-pane label="基本信息" name="baseInfo">
              <el-form :model="form" label-width="80px" class="user-form">
                <el-form-item label="用户名">
                  <el-input v-model="form.username" placeholder="请输入用户名">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="性别">
                  <el-select v-model="form.sex" placeholder="请选择性别" style="width: 100%;">
                    <el-option v-for="item in sexOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="生日">
                  <el-date-picker 
                    v-model="form.birthday" 
                    type="date" 
                    placeholder="选择日期" 
                    style="width: 100%;"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
                
                <el-form-item label="所在地">
                  <china-city-code-cascader 
                    @on-changed="handleCitySelect"
                    :placeholder="form.location || '请选择城市'"
                    style="width: 100%;"
                  ></china-city-code-cascader>
                </el-form-item>
                
                <el-form-item label="技能栈">
                  <el-input v-model="form.skills" placeholder="例如: Vue, Java, Spring Boot">
                    <template #prefix>
                      <el-icon><MagicStick /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="心情状态">
                  <el-input v-model="form.feelings" placeholder="今天心情怎么样？">
                    <template #prefix>
                      <el-icon><ChatDotRound /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="个人简介">
                  <el-input 
                    v-model="form.description" 
                    type="textarea" 
                    :rows="4" 
                    placeholder="介绍一下你自己..." 
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="onSubmit" :icon="Edit">保存修改</el-button>
                  <el-button @click="resetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="账号安全" name="security" disabled>
              <!-- 预留 -->
              <el-empty description="暂未开放" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.home-container {
  padding: 10px;
}

.profile-card {
  margin-bottom: 20px;
  text-align: center;
  
  .profile-avatar {
    background-color: var(--el-color-primary);
    font-size: 2rem;
    margin-bottom: 15px;
  }
  
  .username {
    margin: 10px 0;
    font-size: 1.5rem;
    color: var(--text-color);
  }
  
  .description {
    color: var(--el-text-color-secondary);
    font-size: 0.9rem;
    margin-bottom: 20px;
    line-height: 1.5;
  }
}

.profile-details {
  text-align: left;
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
  
  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: var(--el-text-color-regular);
    
    .el-icon {
      margin-right: 8px;
    }
  }
}

.edit-card {
  .card-header {
    font-weight: bold;
  }
}

.user-form {
  max-width: 600px;
}

@media (max-width: 768px) {
  .home-container {
    padding: 10px;
    padding-bottom: 60px; /* 增加底部留白 */
    overflow: visible !important;
  }
  
  :deep(.el-tabs__content) {
    overflow: visible !important;
  }
  
  :deep(.el-tab-pane) {
    overflow: visible !important;
  }
  
  .profile-card {
    margin-bottom: 15px;
    
    .profile-avatar {
      width: 80px !important;
      height: 80px !important;
      font-size: 1.5rem;
    }
    
    .username {
      font-size: 1.2rem;
    }
  }
  
  .edit-card {
    :deep(.el-card__body) {
      padding: 15px;
    }
    
    :deep(.el-form-item) {
      margin-bottom: 15px;
    }
  }
}
</style>
