/**
 * @description 导出默认网路配置
 **/
export default {
  // 默认的接口地址 如果是开发环境和生产环境走vab-mock-server，当然你也可以选择自己配置成需要的接口地址
  // baseURL: "http://192.168.10.107:8080",
  baseURL: "http://10.188.133.100:8090",
  //配后端数据的接收方式application/json;charset=UTF-8或者application/x-www-form-urlencoded;charset=UTF-8
  contentType: "application/json;charset=UTF-8",
  //消息框消失时间
  messageDuration: 3000,
  //最长请求时间
  requestTimeout: 5000,
  //操作正常code，支持String、Array、int多种类型
  successCode: [200, 0, "10000"],
  //登录失效code
  invalidCode: 402,
  //无权限code
  noPermissionCode: 401,
};
