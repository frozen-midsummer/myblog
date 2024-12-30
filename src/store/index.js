import { createStore } from "vuex";

// 动态加载 ./modules 目录下的所有模块
const moduleFiles = import.meta.glob("./modules/*.js", { eager: true });

// 创建一个空的对象来存储模块
const modules = {};

// 遍历所有匹配的模块文件并立即加载它们
for (const path in moduleFiles) {
  const moduleName = path.match(/\.\/modules\/(.*)\.js$/)[1];
  modules[moduleName] = moduleFiles[path].default;

  // 为所有模块启用命名空间
  if (!modules[moduleName].namespaced) {
    modules[moduleName].namespaced = true;
  }
}

// 创建 Vuex Store 实例
const store = createStore({
  modules,
});

export default store;
