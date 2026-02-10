<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { Sunny, Moon, ArrowDown, User, SwitchButton, House, List, Cloudy } from '@element-plus/icons-vue'
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

const navItems = [
  { index: 'home', route: '/home', label: 'Home', icon: House },
  { index: 'todos', route: '/todos', label: 'Todos', icon: List },
  { index: 'weather', route: '/weather', label: 'Weather', icon: Cloudy },
]

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
          <el-menu-item v-for="item in navItems" :key="item.index" :index="item.index" :route="item.route">
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.label }}</span>
          </el-menu-item>
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
          <a href="https://github.com/frozen-midsummer/myblog" target="_blank" class="social-link github-link" title="GitHub">
            <GithubIcon class="icon-svg" />
          </a>

          <!-- User Profile -->
          <el-dropdown v-if="username" trigger="click">
            <span class="user-info">
              <el-avatar :size="28" class="user-avatar">
                {{ username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username-text">{{ username }}</span>
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
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
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
  flex-shrink: 0;
}

.nav-menu {
  border-bottom: none !important;
  flex: 1;
  background: transparent;
  min-width: 0;
  
  :deep(.el-menu-item) {
    background: transparent !important;
    padding: 0 15px;
    
    &:hover {
      color: var(--el-color-primary);
    }
    
    .nav-icon {
      margin-right: 4px;
      display: none;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .app-wrapper {
    display: flex;
    flex-direction: column;
    height: auto !important;
    min-height: 100vh;
  }

  .app-header {
    .header-content {
      padding: 0 10px;
    }
  }
  
  .logo {
    margin-right: 10px;
    font-size: 1.2rem;
  }
  
  .nav-menu {
    :deep(.el-menu-item) {
      padding: 0 10px;
      
      .nav-text {
        display: none;
      }
      
      .nav-icon {
        display: inline-flex;
        margin-right: 0;
        font-size: 18px;
      }
    }
  }
  
  .header-right {
    gap: 8px;
    
    .github-link {
      display: none;
    }
    
    .theme-switch {
      margin-right: 0;
    }
    
    .user-info {
      .username-text {
        display: none;
      }
      
      .el-icon--right {
        display: none;
      }
      
      .user-avatar {
        margin-right: 0;
      }
    }
  }

  .app-main {
    padding: 12px;
    display: block;
    overflow: visible;
    flex: none;
    height: auto !important;
  }
}

.social-link {
  display: flex;
  align-items: center;
  color: var(--text-color);
  transition: color 0.3s;
  
  &:hover {
    color: var(--el-color-primary);
  }
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--text-color);
  outline: none;
  gap: 8px;
  
  &:hover {
    color: var(--el-color-primary);
  }

  .user-avatar {
    background-color: var(--el-color-primary);
    color: #fff;
    font-size: 14px;
    flex-shrink: 0;
  }
}

.app-main {
  padding: 20px;
  background-color: var(--bg-color-mute);
  flex: 1;
  display: flex;
  justify-content: center;
  overflow: visible;
  
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
