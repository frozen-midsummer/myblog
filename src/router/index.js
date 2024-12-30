import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import { validateToken } from "@/api/backend";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    },
    {
      path: "/todos",
      name: "todos",
      component: () => import("@/views/todos/Todos.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// 路由拦截
router.beforeEach(async (to, from, next) => {
  // 如果目标路由是登录页面，则直接放行
  if (to.path === "/login") {
    return next();
  }
  const requiresAuth = to.meta.requiresAuth;
  // 检查是否需要认证以及用户是否已登录
  const isUserLoggedIn =
    localStorage.getItem("token") && localStorage.getItem("username");

  if (requiresAuth && !isUserLoggedIn) {
    // 如果需要认证且用户未登录，则重定向到登录页面
    return next({ path: "/login" });
  } else if (requiresAuth && isUserLoggedIn) {
    try {
      // 验证令牌
      const response = await validateToken({
        username: localStorage.getItem("username"),
      });

      if (response.errorNo === 0) {
        // 如果令牌验证成功，则允许继续导航
        next();
      } else {
        // 如果令牌验证失败，可以选择重定向到登录或其他处理逻辑
        next({ path: "/login", query: { redirect: to.fullPath } });
      }
    } catch (error) {
      // 处理验证过程中可能发生的错误（如网络问题）
      console.error("Token validation failed:", error);
      next({ path: "/login", query: { redirect: to.fullPath } });
    }
  } else {
    // 如果不需要认证，则直接放行
    next();
  }
});

export default router;
