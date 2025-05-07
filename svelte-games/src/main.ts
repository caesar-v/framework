import { mount } from 'svelte'
import '@unocss/reset/tailwind.css'
import 'uno.css'
import './app.css'
import './classic.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
