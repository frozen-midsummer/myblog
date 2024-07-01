import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import store from "./store";

const app = createApp(App);
app.use(router);
app.use(store);
//size 用于设置表单组件的默认尺寸，zIndex 用于设置弹出组件的层级，zIndex 的默认值为 2000
app.use(ElementPlus, { size: "default", zIndex: 3000 });
app.mount("#app");
app.prototype.$store = store;
app.prototype.$router = router;