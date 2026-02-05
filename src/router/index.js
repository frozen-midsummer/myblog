import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import store from "@/store";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/components/Login.vue"),
      meta: { guest: true }, // 仅游客访问
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/components/Register.vue"),
      meta: { guest: true },
    },
    {
      path: "/todos",
      name: "todos",
      component: () => import("@/views/todos/Todos.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/weather",
      name: "weather",
      component: () => import("@/views/weather/Weather.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/home",
    },
  ],
});

// 路由拦截
router.beforeEach((to, from, next) => {
  const token = store.getters["token/getToken"] || localStorage.getItem("token");

  // 如果已登录且访问登录/注册页，重定向到首页
  if (to.meta.guest && token) {
    return next({ path: "/home" });
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !token) {
    // 如果需要认证且用户未登录，则重定向到登录页面
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else {
    // 否则直接放行
    next();
  }
});

export default router;
