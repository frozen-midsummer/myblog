<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { Sunny, Moon, ArrowDown, User, SwitchButton } from '@element-plus/icons-vue'
import GithubIcon from "./components/icons/GithubIcon.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

// 计算当前激活的菜单项，基于路由名称
const activeIndex = computed(() => route.name || 'home');

// 主题切换 - 使用 computed 的 get/set 确保双向绑定正确
const isDark = computed({
  get: () => store.getters["theme/currentTheme"] === "dark",
  set: () => store.dispatch('theme/toggleTheme')
});

const username = computed(() => store.getters["token/username"]);

function handleLogout() {
  store.dispatch("token/logout");
  router.push('/login');
}

onMounted(() => {
  // 应用挂载时初始化登录信息
  store.dispatch("token/initLoginState");
})
</script>

<template>
  <el-container class="app-wrapper">
    <el-header class="app-header">
      <div class="header-content">
        <!-- Logo -->
        <div class="logo">
          <span class="logo-text">MyBlog</span>
        </div>

        <!-- Navigation -->
        <el-menu
          :default-active="activeIndex"
          class="nav-menu"
          mode="horizontal"
          :ellipsis="false"
          router
        >
          <el-menu-item index="home" route="/home">Home</el-menu-item>
          <el-menu-item index="todos" route="/todos">Todos</el-menu-item>
          <el-menu-item index="weather" route="/weather">Weather</el-menu-item>
        </el-menu>

        <div class="header-right">
          <!-- Theme Toggle -->
          <el-switch
            v-model="isDark"
            class="theme-switch"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            style="--el-switch-on-color: #333;"
          />

          <!-- Github Link -->
          <a href="https://github.com/frozen-midsummer/myblog" target="_blank" class="social-link" title="GitHub">
            <GithubIcon class="icon-svg" />
          </a>

          <!-- User Profile -->
          <el-dropdown v-if="username" trigger="click">
            <span class="user-info">
              <el-icon class="el-icon--left"><User /></el-icon>
              {{ username }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <div v-else class="login-btn">
             <el-button type="primary" link @click="router.push('/login')">登录</el-button>
          </div>
        </div>
      </div>
    </el-header>

    <el-main class="app-main">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 0;
  height: var(--header-height, 60px);
  background-color: var(--bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-light, #e4e7ed);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px;
  }
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--el-color-primary, #409eff);
  margin-right: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.nav-menu {
  border-bottom: none !important;
  flex: 1;
  background: transparent;
  
  :deep(.el-menu-item) {
    background: transparent !important;
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.social-link {
  display: flex;
  align-items: center;
  color: var(--text-color, #333);
  transition: color 0.3s;
  
  &:hover {
    color: var(--el-color-primary);
  }
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--text-color, #333);
  outline: none;
  
  &:hover {
    color: var(--el-color-primary);
  }
}

.app-main {
  padding: 20px;
  background-color: var(--bg-color-mute, #f5f7fa);
  flex: 1;
  display: flex;
  justify-content: center;
  
  > * {
    width: 100%;
    max-width: 1200px;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
