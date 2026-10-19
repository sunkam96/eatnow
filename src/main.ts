import './style.css'
import { renderRoom } from './room'
import { startNewRoom } from './ui'

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

// Tiny router: "/" is the landing page (already in index.html), "/r/:id" is a room.
const roomMatch = window.location.pathname.match(/^\/r\/([a-z0-9]+)\/?$/i)
const hero = document.querySelector<HTMLElement>('.hero')

if (hero && roomMatch) {
  renderRoom(hero, roomMatch[1].toLowerCase())
} else {
  const start = document.getElementById('start-room') as HTMLButtonElement | null
  if (start) start.onclick = () => startNewRoom(start)
}
