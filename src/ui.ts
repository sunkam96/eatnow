import { createRoom } from './api'

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

export async function startNewRoom(button: HTMLButtonElement) {
  const label = button.textContent
  button.disabled = true
  button.textContent = 'Starting…'
  try {
    const { roomId } = await createRoom()
    window.location.assign(`/r/${roomId}`)
  } catch {
    button.disabled = false
    button.textContent = label
    alert("Couldn't start a room. Try again in a sec.")
  }
}
