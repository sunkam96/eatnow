import { ANYWHERE, BOROUGHS, NEIGHBORHOODS, neighborhoodName } from './shared/neighborhoods'

type Child = Node | string | null | false | undefined

// Builds DOM nodes. Strings are added as text, never parsed as HTML,
// so names like "<script>" can't inject anything.
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  Object.assign(node, props)
  for (const child of children) {
    if (child !== null && child !== false && child !== undefined) node.append(child)
  }
  return node
}

// A labelled form field. Wrapping the control in <label> ties the two together.
export function field(label: string, control: HTMLElement) {
  return el('label', { className: 'field' }, el('span', { className: 'field-label', textContent: label }), control)
}

// Native dropdown of NYC neighborhoods grouped by borough.
export function neighborhoodSelect(options: { name: string; placeholder?: string; anywhere?: boolean }) {
  const select = el('select', { name: options.name, required: true })
  if (options.anywhere) {
    select.append(el('option', { value: ANYWHERE, textContent: 'Anywhere fair for everyone', selected: true }))
  } else if (options.placeholder) {
    select.append(el('option', { value: '', textContent: options.placeholder, disabled: true, selected: true }))
  }
  for (const borough of BOROUGHS) {
    const group = el('optgroup', { label: borough })
    for (const n of NEIGHBORHOODS) {
      if (n.borough === borough) group.append(el('option', { value: n.id, textContent: n.name }))
    }
    select.append(group)
  }
  return select
}

// Dinner times are shown in New York time for everyone.
const whenFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/New_York',
})

export function formatWhen(ms: number): string {
  return whenFormat.format(ms)
}

export function describeArea(area: string): string {
  return area === ANYWHERE ? 'anywhere fair' : `around ${neighborhoodName(area)}`
}

// Next 7:30pm: today if it's before 5pm, otherwise tomorrow.
export function defaultDinnerTime(now = new Date()): Date {
  const time = new Date(now)
  time.setHours(19, 30, 0, 0)
  if (now.getHours() >= 17) time.setDate(time.getDate() + 1)
  return time
}

// Format for <input type="datetime-local">: YYYY-MM-DDTHH:MM in local time.
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
