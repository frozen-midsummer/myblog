<script setup>
import { ref, onMounted, onUpdated, computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useStore } from "vuex";
import { useRouter } from 'vue-router';
import { Sunny, Moon, ArrowDown, User, SwitchButton } from '@element-plus/icons-vue'
import LightSwitchIcon from '@/components/icons/IconLightSwitch.vue'
import GithubIcon from "./components/icons/GithubIcon.vue";
const store = useStore();
const router = useRouter();
//获取当前主题
const currTheme = ref(store.getters["theme/currentTheme"] === "dark")
// 方法：切换主题
const toggleTheme = () => {
  store.dispatch('theme/toggleTheme');
};
function loginOut() {
  store.dispatch("token/logout");
  router.push('/login');
}
onMounted(() => {
  //应用挂载时初始化登录信息
  store.dispatch("token/initLoginState");
})
</script>

<template>
  <div>
    <el-container>
      <el-header>
        <el-menu :default-active="activeIndex" class="el-menu-top" mode="horizontal" router :ellipsis="true"
          @select="handleSelect">
          <el-menu-item index="1" route="home">Home</el-menu-item>
          <el-menu-item index="2" route="todos">Todos</el-menu-item>
          <el-menu-item index="3" route="weather">Weather</el-menu-item>
          <el-menu-item index="4" route="nav2">nav2</el-menu-item>
          <el-menu-item index="5">Home1</el-menu-item>
          <el-menu-item class="theme-toggler">
            <el-switch v-model="currTheme" @Change="toggleTheme"
              style="--el-switch-on-color:var(--bg-color-mute);--el-switch-border-color: var(--border-color)">
              <template #active-action>
                <el-icon style="color:#2c2c2c;font-size:small;margin-left: 5px;">
                  <Moon />
                </el-icon>
              </template>
              <template #inactive-action>
                <el-icon style="color:#606266;font-size:small;margin-left: 5px;">
                  <Sunny />
                </el-icon>
              </template>
            </el-switch>
          </el-menu-item>
          <el-menu-item class="github-link">
            <a href="https://github.com/frozen-midsummer/myblog" title="GitHub" class="social-link">
              <GithubIcon></GithubIcon>
            </a>
          </el-menu-item>
          <el-sub-menu>
            <template #title>
              <span style="font-size: large;">
                <el-icon class="el-icon--left">
                  <user />
                </el-icon>{{ store.getters["token/username"] }}
              </span>
            </template>
            <el-menu-item style="font-size: small;" @click="loginOut">
              <el-icon class="el-icon--left">
                <switch-button />
              </el-icon>
              退出登录
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.social-link {
  display: flex;
  align-items: center;
}

.social-link:hover {
  background-color: transparent;
}

.el-menu-item {
  font-size: large;
}

.personal-center {
  display: flex;
  align-items: center;
}

.theme-toggler {
  display: flex;
  align-items: center;
}

.github-link {
  display: flex;
  align-items: center;
}

.el-menu--horizontal>.el-menu-item:nth-child(5) {
  margin-right: auto;
}

.el-menu-top {
  background-color: transparent
}
</style>
