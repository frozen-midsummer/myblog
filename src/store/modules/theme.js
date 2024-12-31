import { login } from "@/api/backend";

const state = () => ({
  theme: "light",
});
const mutations = {
  SET_THEME(state, theme) {
    state.theme = theme;
  },
};
const actions = {
  toggleTheme({ commit, state }) {
    const newTheme = state.theme === "light" ? "dark" : "light";
    commit("SET_THEME", newTheme);
    localStorage.setItem("userTheme", newTheme);

    // 在 'dark' 和 'light' 类之间切换
    if (newTheme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  },
  initializeTheme({ commit }) {
    const savedTheme = localStorage.getItem("userTheme");
    if (savedTheme) {
      commit("SET_THEME", savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.add("light");
      }
    } else {
      // 如果没有保存的主题，则根据操作系统主题偏好初始化
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      commit("SET_THEME", systemTheme);
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.add("light");
      }
    }
  },
};
const getters = {
  currentTheme: (state) => state.theme,
};
export default { state, getters, mutations, actions };
