import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/zcool-qingke-huangyou'
import '@fontsource-variable/jetbrains-mono'
import '@/assets/global.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')
