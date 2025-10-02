import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import "virtual:uno.css";
import "@unocss/reset/normalize.css";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

createApp(App).use(pinia).mount("#app");
