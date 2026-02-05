import { ElMessage, ElLoading } from "element-plus";
import axios from "axios";
import configs from "@/config";
import store from "@/store";
import qs from "qs";
import router from "@/router";
import { isArray } from "@/utils/validate";

const {
  baseURL,
  contentType,
  debounce = [], // 默认为空数组
  invalidCode,
  noPermissionCode,
  requestTimeout,
  successCode,
} = configs;

let loadingInstance;

/**
 * 处理异常码
 * @param {number|string} code 
 * @param {string} msg 
 */
const handleCode = (code, msg) => {
  switch (code) {
    case invalidCode:
      ElMessage.error(msg || "登录已过期，请重新登录");
      store.dispatch("token/logout");
      // 重定向到登录页，并带上当前页面路径，以便登录后跳转回来
      router.push({
        path: "/login",
        query: { redirect: router.currentRoute.value.fullPath },
      }).catch(() => {});
      break;
    case noPermissionCode:
      router.push({ path: "/401" }).catch(() => {});
      ElMessage.error(msg || "您没有权限访问此资源");
      break;
    default:
      ElMessage.error(msg || `后端接口异常 code:${code}`);
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
    const token = store.getters["token/getToken"];
    if (token) {
      if (!config.withoutToken) {
        config.headers.Authorization = "Bearer " + token;
      }
    }

    // 处理 POST 请求的数据格式
    if (
      config.data &&
      config.headers["Content-Type"] ===
        "application/x-www-form-urlencoded;charset=UTF-8"
    ) {
      config.data = qs.stringify(config.data);
    }

    // 防抖与 Loading 处理
    if (debounce.some((item) => config.url.includes(item))) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: "Loading...",
        background: "rgba(0, 0, 0, 0.7)",
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (loadingInstance) loadingInstance.close();
    
    const { data, config } = response;
    // 兼容不同的后端返回结构
    // 假设标准结构为 { code, msg, data/result } 或 { errorNo, errorInfo, ... }
    
    let code = data.code;
    let msg = data.msg || data.message;

    // 适配原有逻辑
    if (data.hasOwnProperty("errorNo")) {
      code = data.errorNo;
      msg = data.errorInfo;
    } else if (data.hasOwnProperty("infocode")) {
      code = data.infocode;
      msg = data.info;
    }

    // 成功状态码判断
    const codeVerificationArray = isArray(successCode)
      ? successCode
      : [successCode];

    if (codeVerificationArray.includes(code) || codeVerificationArray.includes(String(code))) {
      return data;
    } else {
      handleCode(code, msg);
      return Promise.reject(
        new Error(`请求异常: ${msg || "Unknown Error"} (Code: ${code})`)
      );
    }
  },
  (error) => {
    if (loadingInstance) loadingInstance.close();
    
    let { message, response } = error;
    
    if (response && response.data) {
        const { status, data } = response;
        handleCode(status, data.msg || message || "Request Failed");
    } else {
        if (message === "Network Error") {
            message = "后端接口连接异常";
        } else if (message.includes("timeout")) {
            message = "后端接口请求超时";
        } else if (message.includes("Request failed with status code")) {
            message = `后端接口${message.substr(message.length - 3)}异常`;
        }
        ElMessage.error(message || "后端接口未知异常");
    }
    return Promise.reject(error);
  }
);

export default instance;
