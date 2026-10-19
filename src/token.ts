// Remembers which member you are in each room, so a refresh doesn't make you join twice.
// Storage can be unavailable (private mode, blocked site data), so every call is guarded.

const key = (roomId: string) => `eatnow:member:${roomId}`

export function loadToken(roomId: string): string | null {
  try {
    return localStorage.getItem(key(roomId))
  } catch {
    return null
  }
}

export function saveToken(roomId: string, token: string) {
  try {
    localStorage.setItem(key(roomId), token)
  } catch {
    // Not fatal: you stay joined until you close the tab.
  }
}

export function clearToken(roomId: string) {
  try {
    localStorage.removeItem(key(roomId))
  } catch {
    // Nothing to do.
  }
}
