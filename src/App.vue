<script setup>
import { ref, onMounted, onUpdated, computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useStore } from "vuex";
import { Sunny, Moon } from '@element-plus/icons-vue'
import LightSwitchIcon from '@/components/icons/IconLightSwitch.vue'
import GithubIcon from "./components/icons/GithubIcon.vue";
const store = useStore();
//获取当前主题
const currTheme = ref(store.getters["theme/currentTheme"] === "dark")
// 方法：切换主题
const toggleTheme = () => {
  store.dispatch('theme/toggleTheme');
};
onMounted(() => {
  //应用挂载时初始化登录信息
  store.dispatch("token/initLoginState");
})
</script>

<template>
  <div>
    <el-container>
      <el-header>
        <el-menu :default-active="activeIndex" class="el-menu-top" mode="horizontal" :ellipsis="false" router
          @select="handleSelect">
          <el-menu-item index="1" route="home">Home</el-menu-item>
          <el-menu-item index="2" route="todos">Todos</el-menu-item>
          <el-menu-item index="3" route="nav1">nav1</el-menu-item>
          <el-menu-item index="4" route="nav2">nav2</el-menu-item>
          <el-menu-item index="5">Home1</el-menu-item>
          <div class="theme-toggler">
            <el-switch v-model="currTheme" :active-action-icon="Moon" :inactive-action-icon="Sunny" @Change="toggleTheme">
              <template #inactive-action>
                <el-icon color="#606266">
                  <Sunny />
                </el-icon>
              </template>
            </el-switch>
          </div>
          <div class="theme-toggler" style="width:1em"></div>
          <div class="theme-toggler">
            <a href="https://github.com/frozen-midsummer/myblog" title="GitHub" class="social-link">
              <GithubIcon></GithubIcon>
            </a>
          </div>
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
  margin-top: 5px;
}

.el-menu-item {
  font-size: large;
}

.theme-toggler {
  display: flex;
  align-items: center;
}

.el-menu-top {
  background-color: transparent
}

.el-menu--horizontal>.el-menu-item:nth-child(5) {
  margin-right: auto;
}
</style>
