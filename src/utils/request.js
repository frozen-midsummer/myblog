import ElementPlus, { ElMessage } from "element-plus";
import axios from "axios";
import configs from "@/config";
import store from "@/store";
import qs from "qs";
import router from "@/router";
import { isArray } from "@/utils/validate";

// 使用解构赋值来简化对 config 属性的访问
const {
  baseURL,
  contentType,
  debounce,
  invalidCode,
  loginInterception,
  noPermissionCode,
  requestTimeout,
  successCode,
  tokenName,
} = configs;

let loadingInstance;

/**
 * @author
 * @description 处理code异常
 * @param {*} code
 * @param {*} msg
 */
const handleCode = (code, msg) => {
  switch (code) {
    case invalidCode:
      ElMessage(msg || `后端接口${code}异常`);
      store.dispatch("user/resetAccessToken").catch(() => {});
      if (loginInterception) {
        location.reload();
      }
      break;
    case noPermissionCode:
      router.push({ path: "/401" }).catch(() => {});
      break;
    default:
      ElMessage(msg || `后端接口${code}异常`);
      break;
  }
};

const instance = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    "Content-Type": contentType,
  },
});

instance.interceptors.request.use(
  (config) => {
    if (store.getters["token/getToken"]) {
      config.headers.Authorization =
        "Bearer " + store.getters["token/getToken"];
    }
    //这里会过滤所有为空、0、false的key，如果不需要请自行注释
    // if (config.data)
    //   config.data = Vue.prototype.$baseLodash.pickBy(
    //     config.data,
    //     Vue.prototype.$baseLodash.identity
    //   );
    if (
      config.data &&
      config.headers["Content-Type"] ===
        "application/x-www-form-urlencoded;charset=UTF-8"
    )
      config.data = qs.stringify(config.data);
    //防抖，不需要请自行注释
    if (debounce.some((item) => config.url.includes(item)))
      loadingInstance = ElLoading.service({
        lock: true,
        text: "Loading",
        // background: "rgba(0, 0, 0, 0.7)",
      });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    // 清空正在运行的loading
    if (loadingInstance) loadingInstance.close();
    const { data, config } = response;
    const { errorNo, errorInfo } = data;
    // 操作正常Code数组
    const codeVerificationArray = isArray(successCode)
      ? [...successCode]
      : [...[successCode]];
    // 是否操作正常
    if (codeVerificationArray.includes(errorNo)) {
      return data;
    } else {
      handleCode(errorNo, errorInfo);
      return Promise.reject(
        `请求异常拦截:${JSON.stringify({
          url: config.url,
          errorNo,
          errorInfo,
        })}` || "Error"
      );
    }
  },
  (error) => {
    if (loadingInstance) loadingInstance.close();
    const { response, message } = error;
    if (error.response && error.response.data) {
      const { status, data } = response;
      handleCode(status, data.msg || message);
      return Promise.reject(error);
    } else {
      let { message } = error;
      if (message === "Network Error") {
        message = "后端接口连接异常";
      }
      if (message.includes("timeout")) {
        message = "后端接口请求超时";
      }
      if (message.includes("Request failed with status code")) {
        const code = message.substr(message.length - 3);
        message = `后端接口${code}异常`;
      }
      ElMessage(message || `后端接口未知异常`);
      return Promise.reject(error);
    }
  }
);

export default instance;
