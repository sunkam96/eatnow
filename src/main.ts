import './style.css'

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

// Tiny router: "/" is the landing page (already in index.html), "/r/:id" is a room.
const roomMatch = window.location.pathname.match(/^\/r\/([a-z0-9]+)\/?$/i)

if (roomMatch) {
  renderRoom(roomMatch[1])
}

function renderRoom(roomId: string) {
  const hero = document.querySelector<HTMLElement>('.hero')
  if (!hero) return
  document.title = `Room ${roomId} · eat now`
  hero.innerHTML = `
    <h1>Room <span class="nowrap">${roomId}</span></h1>
    <p class="tagline">Placeholder: joining a room comes next.</p>
  `
}
