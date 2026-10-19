import { ApiError, fetchRoom, joinRoom } from './api'
import { CLOSES_HOURS_AFTER_DINNER, MAX_MEMBERS, NAME_MAX_LENGTH, type RoomView } from './shared/api'
import { neighborhoodName } from './shared/neighborhoods'
import { clearToken, loadToken, saveToken } from './token'
import { describeArea, el, field, formatWhen, neighborhoodSelect } from './ui'

const POLL_MS = 2500

const hostName = (room: RoomView) => room.members.find((m) => m.host)?.name ?? 'Someone'
const titleOf = (room: RoomView) => `${hostName(room)}'s dinner`
const detailsOf = (room: RoomView) => `${formatWhen(room.startsAt)} · ${describeArea(room.area)}`

export function renderRoom(hero: HTMLElement, roomId: string) {
  let token = loadToken(roomId)
  let pollTimer: number | undefined
  let polling = false
  let membersList: HTMLUListElement | null = null
  let countLine: HTMLParagraphElement | null = null
  let statusLine: HTMLParagraphElement | null = null

  const show = (...nodes: Node[]) => hero.replaceChildren(...nodes)
  const isMember = (room: RoomView) => room.members.some((m) => m.you)

  function planNewButton(label = 'Plan a new dinner') {
    const button = el('button', { className: 'cta', type: 'button', textContent: label })
    button.onclick = () => window.location.assign('/')
    return button
  }

  async function load() {
    stopPolling()
    show(el('p', { className: 'tagline', textContent: 'Loading…' }))
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
    document.title = 'eat now'
    show(
      el('h1', { textContent: "This dinner's gone" }),
      el('p', {
        className: 'tagline',
        textContent: `Rooms close ${CLOSES_HOURS_AFTER_DINNER} hours after dinner, or the link might be off.`,
      }),
      planNewButton(),
    )
  }

  function showFull(room: RoomView) {
    show(
      el('h1', { textContent: `${titleOf(room)} is full` }),
      el('p', { className: 'tagline', textContent: `It already has ${MAX_MEMBERS} people.` }),
      planNewButton('Plan your own dinner'),
    )
  }

  function showJoin(room: RoomView) {
    document.title = `${titleOf(room)} · eat now`
    if (room.members.length >= MAX_MEMBERS) return showFull(room)

    const name = el('input', {
      type: 'text',
      name: 'name',
      placeholder: 'Your name',
      maxLength: NAME_MAX_LENGTH,
      required: true,
      autocomplete: 'given-name',
    })
    const from = neighborhoodSelect({ name: 'from', placeholder: 'Pick a neighborhood' })
    const submit = el('button', { className: 'cta', type: 'submit', textContent: "I'm in" })
    const error = el('p', { className: 'form-error', role: 'alert' })
    const form = el(
      'form',
      { className: 'form' },
      field('Your name', name),
      field('Coming from', from),
      submit,
      error,
    )

    form.onsubmit = async (event) => {
      event.preventDefault()
      const trimmed = name.value.trim()
      if (!trimmed) {
        error.textContent = 'Enter a name first.'
        return
      }
      if (!from.value) {
        error.textContent = "Pick where you're coming from."
        return
      }
      submit.disabled = true
      error.textContent = ''
      try {
        const { memberToken } = await joinRoom(roomId, { name: trimmed, from: from.value })
        token = memberToken
        saveToken(roomId, memberToken)
        showRoom(await fetchRoom(roomId, token))
      } catch (err) {
        submit.disabled = false
        const code = err instanceof ApiError ? err.code : ''
        if (code === 'room_full') return showFull(room)
        if (code === 'not_found') return showGone()
        error.textContent =
          code === 'bad_name'
            ? `Names need 1–${NAME_MAX_LENGTH} characters.`
            : code === 'bad_location'
              ? 'Pick a neighborhood from the list.'
              : "Couldn't join. Try again."
      }
    }

    const nodes: Node[] = [
      el('h1', { textContent: titleOf(room) }),
      el('p', { className: 'tagline', textContent: detailsOf(room) }),
    ]
    const names = room.members.map((m) => m.name).join(', ')
    if (names) nodes.push(el('p', { className: 'muted', textContent: `Coming: ${names}` }))
    nodes.push(form)
    show(...nodes)
  }

  function showRoom(room: RoomView) {
    document.title = `${titleOf(room)} · eat now`
    membersList = el('ul', { className: 'members' })
    countLine = el('p', { className: 'muted' })
    statusLine = el('p', { className: 'muted status' })
    const share = el('button', { className: 'cta', type: 'button', textContent: 'Share link' })
    share.onclick = () => shareLink(share, room)

    show(
      el('h1', { textContent: titleOf(room) }),
      el('p', { className: 'tagline', textContent: detailsOf(room) }),
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
      ...room.members.map((m) => {
        const tags = [m.host && 'host', m.you && 'you'].filter(Boolean).join(' · ')
        return el(
          'li',
          {},
          el('span', { className: 'member-name' }, m.name, tags ? el('span', { className: 'member-tags', textContent: ` (${tags})` }) : null),
          el('span', { className: 'member-from', textContent: `from ${neighborhoodName(m.from)}` }),
        )
      }),
    )
    const n = room.members.length
    countLine.textContent = `${n} coming · room for ${MAX_MEMBERS}`
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

  async function shareLink(button: HTMLButtonElement, room: RoomView) {
    const url = `${window.location.origin}/r/${roomId}`
    const text = `${titleOf(room)}: ${detailsOf(room)}. Say where you're coming from:`
    if ('share' in navigator) {
      try {
        await navigator.share({ title: 'eat now', text, url })
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
