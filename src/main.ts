import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import "virtual:uno.css";
import "@unocss/reset/normalize.css";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { Message } from "@arco-design/web-vue";
import "@arco-design/web-vue/es/message/style/css.js";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
Message._context = app._context;

app.use(pinia).mount("#app");
