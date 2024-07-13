import Vuex from "vuex";
import axios from "axios";

const store = new Vuex.Store({
  state: {
    token: null,
    username: null,
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
    },
    SET_USERNAME(state, username) {
      state.username = username;
    },
  },
  actions: {
    async login({ commit }, payload) {
      // 这里应该是调用API进行登录验证，假设验证通过，将token保存
      const response = await axios.post(
        "http://10.188.133.100:8080/api/authenticate",
        {
          username: payload.username,
          password: payload.password,
        }
      );
      console.log(response);
      if (response.status === 200 && response.data.token) {
        const token = response.data.token; // 假设从服务器获取的token
        commit("SET_TOKEN", token);
        commit("SET_USERNAME", payload.username);
        localStorage.setItem("token", token);
        localStorage.setItem("username", payload.username); // 同步到localStorage
        console.log("登录成功,获取到的Token:", token);
      } else {
        throw new Error("用户名或密码错误");
      }
    },
    logout({ commit }) {
      commit("SET_TOKEN", null);
      localStorage.removeItem("token");
      commit("SET_USERNAME", null);
      localStorage.removeItem("username");
    },
    // 初始化状态，如从localStorage恢复token
    initLoginState({ commit }) {
      const token = localStorage.getItem("token");
      if (token) {
        commit("SET_TOKEN", token);
      }
      const username = localStorage.getItem("username");
      if (username) {
        commit("SET_USERNAME", username);
      }
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.token,
    getToken: (state) => state.token,
  },
});

export default store;
