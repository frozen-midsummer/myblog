<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="whole dark-scheme">
    <header>
      <div class="wrapper">
        <!-- <HelloWorld msg="<h1>Patience is key in life</h1>" /> -->
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/notes">Notes</RouterLink>
          <RouterLink to="/todos">Todos</RouterLink>
          <RouterLink to="/nav1">nav1</RouterLink>
          <RouterLink to="/nav2">nav2</RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
/* 手机端样式 */
header {
  line-height: 1.5;
  max-height: 100vh;
  min-height: 20vh;
}

.logo {
  /* 显示为块级元素，前后带有空格 */
  display: block;
  margin: 0 auto 2rem;
}

nav {
  /* width: 100%; */
  font-size: 1.5rem;
  text-align: center;
  /* margin-top: 2rem; */
}
/* 超链接激活状态颜色 */
nav a.router-link-exact-active {
  color: var(--color-text);
}
/* 鼠标悬停超链接 */
nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
/* 电脑端样式 */
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    /* padding-right: calc(var(--section-gap) / 2); */
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    /*导航条靠左*/
    text-align: left;
    font-size: 1.5rem;

    padding: 1rem 0;
    /* margin-top: 1rem; */
  }
}
</style>
