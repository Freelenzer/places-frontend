import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { initTheme } from './composables/useTheme';
import { initPublicMode } from './composables/usePublicMode';

initTheme(); // ← before app.mount(), prevents flash of wrong theme

initPublicMode().then(() => {
  createApp(App).use(router).mount("#app");
});
