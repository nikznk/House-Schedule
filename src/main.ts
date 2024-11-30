import './app.css'
import App from './App.svelte'

if (!document.getElementById('app')) {
  const appDiv = document.createElement('div')
  appDiv.id = 'app'
  document.body.appendChild(appDiv)
}

const app = new App({
  target: document.getElementById('app') as HTMLElement
})