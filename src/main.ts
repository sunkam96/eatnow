import './style.css'
import { renderRoom } from './room'
import { renderSetup } from './setup'

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

// Tiny router: "/" is the landing page (already in index.html), "/r/:id" is a room.
const roomMatch = window.location.pathname.match(/^\/r\/([a-z0-9]+)\/?$/i)
const hero = document.querySelector<HTMLElement>('.hero')

if (hero && roomMatch) {
  renderRoom(hero, roomMatch[1].toLowerCase())
} else if (hero) {
  const start = document.getElementById('start-room')
  if (start) start.onclick = () => renderSetup(hero)
}
