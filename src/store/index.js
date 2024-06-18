import Vuex from "vuex";

const store = new Vuex.Store({
  state: {
    token: null,
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
    },
  },
  actions: {
    login({ commit }, payload) {
      // 这里应该是调用API进行登录验证，假设验证通过，将token保存
      if (payload.username == "admin" && payload.password == "123456") {
        const token = "yourTokenFromServer"; // 假设从服务器获取的token
        commit("SET_TOKEN", token);
        localStorage.setItem("token", token); // 同步到localStorage
      } else {
        throw new Error("密码错误");
      }
    },
    logout({ commit }) {
      commit("SET_TOKEN", null);
      localStorage.removeItem("token");
    },
    // 初始化状态，如从localStorage恢复token
    initLoginState({ commit }) {
      const token = localStorage.getItem("token");
      if (token) {
        commit("SET_TOKEN", token);
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
});

export default store;
