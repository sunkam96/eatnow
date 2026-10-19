import { ApiError, createRoom } from './api'
import { MAX_DAYS_AHEAD, NAME_MAX_LENGTH } from './shared/api'
import { saveToken } from './token'
import { defaultDinnerTime, el, field, neighborhoodSelect, toLocalInputValue } from './ui'

// Host setup: name, when, where to eat, where they're coming from.
export function renderSetup(hero: HTMLElement) {
  document.title = 'Plan a dinner · eat now'

  const name = el('input', {
    type: 'text',
    name: 'name',
    placeholder: 'Your name',
    maxLength: NAME_MAX_LENGTH,
    required: true,
    autocomplete: 'given-name',
  })
  const when = el('input', {
    type: 'datetime-local',
    name: 'when',
    required: true,
    value: toLocalInputValue(defaultDinnerTime()),
    min: toLocalInputValue(new Date()),
  })
  const area = neighborhoodSelect({ name: 'area', anywhere: true })
  const from = neighborhoodSelect({ name: 'from', placeholder: 'Pick a neighborhood' })
  const submit = el('button', { className: 'cta', type: 'submit', textContent: 'Create dinner' })
  const error = el('p', { className: 'form-error', role: 'alert' })

  const form = el(
    'form',
    { className: 'form' },
    field('Your name', name),
    field('When', when),
    field('Where do you want to eat?', area),
    field('Where are you coming from?', from),
    submit,
    error,
  )

  form.onsubmit = async (event) => {
    event.preventDefault()
    const hostName = name.value.trim()
    const startsAt = new Date(when.value).getTime()

    if (!hostName) {
      error.textContent = 'Enter your name.'
      return
    }
    if (!when.value || Number.isNaN(startsAt)) {
      error.textContent = 'Pick a date and time.'
      return
    }
    if (!from.value) {
      error.textContent = "Pick where you're coming from."
      return
    }

    submit.disabled = true
    error.textContent = ''
    try {
      const { roomId, memberToken } = await createRoom({
        hostName,
        startsAt,
        area: area.value,
        from: from.value,
      })
      saveToken(roomId, memberToken)
      window.location.assign(`/r/${roomId}`)
    } catch (err) {
      submit.disabled = false
      const code = err instanceof ApiError ? err.code : ''
      error.textContent =
        code === 'bad_name'
          ? `Names need 1–${NAME_MAX_LENGTH} characters.`
          : code === 'bad_time'
            ? `Pick a time between now and ${MAX_DAYS_AHEAD} days out.`
            : code === 'bad_location'
              ? 'Pick neighborhoods from the lists.'
              : "Couldn't create the dinner. Try again."
    }
  }

  hero.replaceChildren(
    el('h1', { textContent: 'Plan a dinner' }),
    el('p', { className: 'tagline', textContent: 'Set the when and where, then send the link to your friends.' }),
    form,
  )
  name.focus()
}
