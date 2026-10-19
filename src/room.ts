import { ApiError, fetchRoom, joinRoom } from './api'
import { MAX_MEMBERS, NAME_MAX_LENGTH, ROOM_TTL_HOURS, type RoomView } from './shared/api'
import { clearToken, loadToken, saveToken } from './token'
import { el, startNewRoom } from './ui'

const POLL_MS = 2500

export function renderRoom(hero: HTMLElement, roomId: string) {
  document.title = `Room ${roomId} · eat now`

  let token = loadToken(roomId)
  let pollTimer: number | undefined
  let polling = false
  let membersList: HTMLUListElement | null = null
  let countLine: HTMLParagraphElement | null = null
  let statusLine: HTMLParagraphElement | null = null

  const show = (...nodes: Node[]) => hero.replaceChildren(...nodes)
  const isMember = (room: RoomView) => room.members.some((m) => m.you)

  function newRoomButton(label = 'Start a new room') {
    const button = el('button', { className: 'cta', type: 'button', textContent: label })
    button.onclick = () => startNewRoom(button)
    return button
  }

  async function load() {
    stopPolling()
    show(el('p', { className: 'tagline', textContent: 'Loading room…' }))
    try {
      const room = await fetchRoom(roomId, token)
      if (token && !isMember(room)) forget()
      if (token) showRoom(room)
      else showJoin(room)
    } catch (err) {
      handleError(err)
    }
  }

  function forget() {
    clearToken(roomId)
    token = null
  }

  function handleError(err: unknown) {
    stopPolling()
    if (err instanceof ApiError && err.code === 'not_found') return showGone()
    const retry = el('button', { className: 'cta', type: 'button', textContent: 'Try again' })
    retry.onclick = () => load()
    show(
      el('h1', { textContent: 'Something broke' }),
      el('p', { className: 'tagline', textContent: "Couldn't reach the room. Check your connection." }),
      retry,
    )
  }

  function showGone() {
    show(
      el('h1', { textContent: "This room's gone" }),
      el('p', {
        className: 'tagline',
        textContent: `Rooms expire after ${ROOM_TTL_HOURS} hours, or the link might be off.`,
      }),
      newRoomButton(),
    )
  }

  function showFull() {
    show(
      el('h1', { textContent: 'This room is full' }),
      el('p', { className: 'tagline', textContent: `It already has ${MAX_MEMBERS} people.` }),
      newRoomButton('Start your own room'),
    )
  }

  function showJoin(room: RoomView) {
    if (room.members.length >= MAX_MEMBERS) return showFull()

    const input = el('input', {
      type: 'text',
      name: 'name',
      placeholder: 'Your name',
      maxLength: NAME_MAX_LENGTH,
      required: true,
      autocomplete: 'given-name',
      ariaLabel: 'Your name',
    })
    const submit = el('button', { className: 'cta', type: 'submit', textContent: 'Join' })
    const error = el('p', { className: 'form-error', role: 'alert' })
    const form = el('form', { className: 'join-form' }, input, submit, error)

    form.onsubmit = async (event) => {
      event.preventDefault()
      const name = input.value.trim()
      if (!name) {
        error.textContent = 'Enter a name first.'
        return
      }
      submit.disabled = true
      error.textContent = ''
      try {
        const { memberToken } = await joinRoom(roomId, name)
        token = memberToken
        saveToken(roomId, memberToken)
        showRoom(await fetchRoom(roomId, token))
      } catch (err) {
        submit.disabled = false
        if (err instanceof ApiError && err.code === 'bad_name') {
          error.textContent = `Names need 1–${NAME_MAX_LENGTH} characters.`
        } else if (err instanceof ApiError && err.code === 'room_full') {
          showFull()
        } else if (err instanceof ApiError && err.code === 'not_found') {
          showGone()
        } else {
          error.textContent = "Couldn't join. Try again."
        }
      }
    }

    const nodes: Node[] = [
      el('h1', { textContent: "Who's hungry?" }),
      el('p', { className: 'tagline', textContent: 'Enter your name to join the room.' }),
    ]
    const names = room.members.map((m) => m.name).join(', ')
    if (names) nodes.push(el('p', { className: 'muted', textContent: `Already here: ${names}` }))
    nodes.push(form)
    show(...nodes)
    input.focus()
  }

  function showRoom(room: RoomView) {
    membersList = el('ul', { className: 'members' })
    countLine = el('p', { className: 'muted' })
    statusLine = el('p', { className: 'muted status' })
    const share = el('button', { className: 'cta', type: 'button', textContent: 'Share link' })
    share.onclick = () => shareLink(share)

    show(
      el('h1', { textContent: "Who's in" }),
      countLine,
      membersList,
      share,
      el('p', { className: 'muted', textContent: 'Waiting for everyone. Picking a spot comes next.' }),
      statusLine,
    )
    updateMembers(room)
    startPolling()
  }

  function updateMembers(room: RoomView) {
    if (!membersList || !countLine) return
    membersList.replaceChildren(
      ...room.members.map((m) =>
        el('li', {}, m.name, m.you ? el('span', { className: 'you', textContent: ' (you)' }) : null),
      ),
    )
    const n = room.members.length
    countLine.textContent = `${n} of ${MAX_MEMBERS} spots filled`
  }

  async function poll() {
    if (polling) return
    polling = true
    try {
      const room = await fetchRoom(roomId, token)
      if (statusLine) statusLine.textContent = ''
      if (!isMember(room)) {
        stopPolling()
        forget()
        showJoin(room)
      } else {
        updateMembers(room)
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_found') {
        stopPolling()
        showGone()
      } else if (statusLine) {
        statusLine.textContent = 'Reconnecting…'
      }
    } finally {
      polling = false
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer = window.setInterval(poll, POLL_MS)
  }

  function stopPolling() {
    if (pollTimer !== undefined) window.clearInterval(pollTimer)
    pollTimer = undefined
  }

  // Don't keep polling from a phone that's in someone's pocket.
  document.addEventListener('visibilitychange', () => {
    if (!membersList?.isConnected) return
    if (document.hidden) {
      stopPolling()
    } else {
      poll()
      startPolling()
    }
  })

  async function shareLink(button: HTMLButtonElement) {
    const url = `${window.location.origin}/r/${roomId}`
    if ('share' in navigator) {
      try {
        await navigator.share({ title: 'eat now', text: 'Where are we eating? Join the room:', url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      const label = button.textContent
      button.textContent = 'Link copied!'
      window.setTimeout(() => (button.textContent = label), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  load()
}
